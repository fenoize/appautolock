import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@2.5.2';
import autoTable from 'npm:jspdf-autotable@3.8.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};


const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const quote_id = typeof body?.quote_id === 'string' ? body.quote_id : null;
    if (!quote_id) {
      return new Response(JSON.stringify({ error: 'quote_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client for storage writes & full reads of related data
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Load quote + relations
    const { data: quote, error: qErr } = await admin
      .from('quotes')
      .select(`
        *,
        client:clients(razon_social, nombre_comercial, rut, email_principal, telefonos),
        vehicle:vehicles(marca, modelo, anio, patente),
        vendedor:profiles!quotes_vendedor_id_fkey(nombre, apellido, email),
        branch:branches(nombre, direccion, telefono, email),
        items:quote_items(nombre, descripcion, cantidad, precio_unitario, descuento_porcentaje, subtotal)
      `)
      .eq('id', quote_id)
      .maybeSingle();

    if (qErr || !quote) {
      return new Response(JSON.stringify({ error: qErr?.message ?? 'Cotización no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Company settings (key/value table)
    const { data: settingsRows } = await admin.from('settings').select('clave, valor');
    const settings = new Map<string, string>((settingsRows ?? []).map((r: any) => [r.clave, r.valor]));
    const empresa = {
      nombre: settings.get('empresa_nombre') || 'Autolock',
      rut: settings.get('empresa_rut') || '',
      direccion: settings.get('empresa_direccion') || '',
      telefono: settings.get('empresa_telefono') || '',
      email: settings.get('empresa_email') || '',
      logo_url: settings.get('empresa_logo_url') || '',
    };

    // ===== Build PDF =====
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const M = 40;
    let y = M;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(empresa.nombre, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y += 14;
    if (empresa.rut) { doc.text(`RUT: ${empresa.rut}`, M, y); y += 11; }
    if (empresa.direccion) { doc.text(empresa.direccion, M, y); y += 11; }
    if (empresa.telefono) { doc.text(`Tel: ${empresa.telefono}`, M, y); y += 11; }
    if (empresa.email) { doc.text(empresa.email, M, y); y += 11; }

    // Folio box
    doc.setDrawColor(200);
    doc.rect(W - M - 180, M, 180, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('COTIZACIÓN', W - M - 90, M + 18, { align: 'center' });
    doc.setFontSize(11);
    doc.text(quote.folio, W - M - 90, M + 36, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Emisión: ${fmtDate(quote.fecha_emision)}`, W - M - 90, M + 52, { align: 'center' });
    const vencimiento = quote.fecha_emision
      ? new Date(new Date(quote.fecha_emision).getTime() + (quote.validez_dias || 30) * 86400000).toISOString()
      : null;
    doc.text(`Válida hasta: ${fmtDate(vencimiento)}`, W - M - 90, M + 64, { align: 'center' });

    y = Math.max(y, M + 80) + 10;

    // Cliente / Vehículo
    doc.setDrawColor(220);
    doc.setFillColor(245, 245, 245);
    doc.rect(M, y, W - M * 2, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CLIENTE', M + 6, y + 13);
    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const cliente = quote.client || {};
    const phones = Array.isArray(cliente.telefonos) ? cliente.telefonos.join(', ') : '';
    doc.text(`Razón social: ${cliente.razon_social || cliente.nombre_comercial || '-'}`, M, y); y += 12;
    if (cliente.rut) { doc.text(`RUT: ${cliente.rut}`, M, y); y += 12; }
    if (cliente.email_principal) { doc.text(`Email: ${cliente.email_principal}`, M, y); y += 12; }
    if (phones) { doc.text(`Teléfono: ${phones}`, M, y); y += 12; }

    if (quote.vehicle) {
      y += 4;
      doc.setFillColor(245, 245, 245);
      doc.rect(M, y, W - M * 2, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('VEHÍCULO', M + 6, y + 13);
      y += 22;
      doc.setFont('helvetica', 'normal');
      const v = quote.vehicle;
      doc.text(`${v.marca || ''} ${v.modelo || ''} ${v.anio || ''}  ·  Patente: ${v.patente || '-'}`, M, y);
      y += 14;
    }

    // Items table
    const items = quote.items || [];
    autoTable(doc, {
      startY: y + 6,
      head: [['#', 'Detalle', 'Cant.', 'P. Unitario', 'Dscto %', 'Subtotal']],
      body: items.map((it: any, i: number) => [
        String(i + 1),
        it.descripcion ? `${it.nombre}\n${it.descripcion}` : it.nombre,
        String(it.cantidad),
        fmtCLP(Number(it.precio_unitario || 0)),
        `${Number(it.descuento_porcentaje || 0)}%`,
        fmtCLP(Number(it.subtotal || 0)),
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 80, halign: 'right' },
        4: { cellWidth: 55, halign: 'center' },
        5: { cellWidth: 90, halign: 'right' },
      },
      margin: { left: M, right: M },
    });

    let afterY = (doc as any).lastAutoTable.finalY + 16;

    // Totals
    const neto = Number(quote.neto || 0);
    const iva = Number(quote.iva || 0);
    const total = Number(quote.total || 0);
    const labelX = W - M - 200;
    const valueX = W - M;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Neto', labelX, afterY);
    doc.text(fmtCLP(neto), valueX, afterY, { align: 'right' });
    afterY += 14;
    doc.text('IVA (19%)', labelX, afterY);
    doc.text(fmtCLP(iva), valueX, afterY, { align: 'right' });
    afterY += 6;
    doc.setDrawColor(150);
    doc.line(labelX, afterY, valueX, afterY);
    afterY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL', labelX, afterY);
    doc.text(fmtCLP(total), valueX, afterY, { align: 'right' });
    afterY += 24;

    // Notas
    if (quote.notas) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Notas', M, afterY);
      afterY += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(String(quote.notas), W - M * 2);
      doc.text(lines, M, afterY);
      afterY += lines.length * 11;
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220);
    doc.line(M, pageH - 50, W - M, pageH - 50);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${empresa.nombre}${empresa.email ? ' · ' + empresa.email : ''}${empresa.telefono ? ' · ' + empresa.telefono : ''}`,
      W / 2, pageH - 36, { align: 'center' },
    );
    doc.text(`Cotización ${quote.folio} · Generada ${new Date().toLocaleString('es-CL')}`,
      W / 2, pageH - 24, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');
    const fileName = `quote-${quote.folio}.pdf`;

    const { error: upErr } = await admin.storage
      .from('quote-pdfs')
      .upload(fileName, new Uint8Array(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (upErr) {
      return new Response(JSON.stringify({ error: `Storage upload failed: ${upErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: pub } = admin.storage.from('quote-pdfs').getPublicUrl(fileName);
    const pdf_url = `${pub.publicUrl}?v=${Date.now()}`;

    await admin.from('quotes').update({ pdf_url, updated_at: new Date().toISOString() }).eq('id', quote_id);

    return new Response(JSON.stringify({ success: true, pdf_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-quote-pdf error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
