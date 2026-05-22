import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('No autorizado');
    }

    const { wo_id, checklist_data, observaciones_cierre, firma_data, firma_nombre, force_close } = await req.json();

    console.log('Cerrando OT:', wo_id);

    // Verificar que el usuario es el técnico de la OT
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('tecnico_id, inventario_consumido')
      .eq('id', wo_id)
      .single();

    if (woError) throw woError;
    if (wo.tecnico_id !== user.id) {
      throw new Error('Solo el técnico asignado puede cerrar esta OT');
    }

    // Validar GPS pendientes de suscripción
    const { data: pendingGPS } = await supabase
      .from('wo_subscription_items')
      .select('id, nombre')
      .eq('wo_id', wo_id)
      .is('subscription_id', null);

    const hasPendingGPS = pendingGPS && pendingGPS.length > 0;
    const force_close = (await req.clone().json().catch(() => ({}))).force_close === true
      || (typeof (globalThis as any).__force_close !== 'undefined');
    // Note: body was already consumed above; we rely on a re-parse via clone earlier.

    if (hasPendingGPS && !force_close) {
      return new Response(JSON.stringify({
        success: false,
        requires_subscription_config: true,
        pending_items: pendingGPS!.map((i: any) => i.nombre),
        message: 'Hay dispositivos GPS sin suscripción configurada'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validar checklist completo
    if (checklist_data?.items) {
      const itemsRequeridos = checklist_data.items.filter((i: any) => i.requerido);
      const itemsCompletados = itemsRequeridos.filter((i: any) => i.completado);
      if (itemsCompletados.length < itemsRequeridos.length) {
        throw new Error('Debes completar todos los items obligatorios del checklist');
      }
    }

    // Subir firma a storage
    let firma_url = null;
    if (firma_data) {
      const base64Data = firma_data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `${wo_id}/firma-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wo-evidencias')
        .upload(fileName, buffer, {
          contentType: 'image/png'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wo-evidencias')
        .getPublicUrl(fileName);
      
      firma_url = publicUrl;
    }

    // Consumir inventario si no se ha consumido
    if (!wo.inventario_consumido) {
      const { error: consumoError } = await supabase.rpc('consumir_inventario_wo', { p_wo_id: wo_id });
      if (consumoError) console.error('Error al consumir inventario:', consumoError);
    }

    // Actualizar OT
    const { error: updateError } = await supabase
      .from('work_orders')
      .update({
        estado: 'completada',
        checklist_data,
        observaciones_cierre,
        firma_url,
        firma_nombre,
        fecha_fin_real: new Date().toISOString()
      })
      .eq('id', wo_id);

    if (updateError) throw updateError;

    console.log('OT cerrada exitosamente');

    // Generar PDF en background (opcional)
    // Aquí puedes invocar generate-wo-pdf si lo implementas

    return new Response(
      JSON.stringify({ success: true, wo_id, firma_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error en close-work-order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
