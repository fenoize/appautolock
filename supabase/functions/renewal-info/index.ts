import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const subId = url.searchParams.get("sub");
  const planId = url.searchParams.get("plan");

  if (!subId) {
    return new Response(JSON.stringify({ error: "sub requerido" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select(`
      folio, fecha_vencimiento, estado, plan_id,
      clients!client_id(razon_social, nombre_comercial, email_principal),
      vehicles!vehicle_id(patente, marca, modelo, anio),
      subscription_plans!plan_id(nombre, precio, periodo_meses)
    `)
    .eq("id", subId)
    .single();

  if (subErr || !sub) {
    return new Response(JSON.stringify({ error: "Suscripción no encontrada" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let selectedPlan = (sub as any).subscription_plans;
  if (planId && planId !== (sub as any).plan_id) {
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("nombre, precio, periodo_meses")
      .eq("id", planId)
      .eq("activo", true)
      .single();
    if (plan) selectedPlan = plan;
  }

  const { data: settingsRows } = await supabase
    .from("settings")
    .select("clave, valor")
    .in("clave", ["empresa_razon_social", "empresa_logo_url", "empresa_logo_dark_url", "empresa_telefono", "empresa_email", "empresa_sitio_web"]);

  const getSetting = (key: string) =>
    settingsRows?.find((r: any) => r.clave === key)?.valor ?? "";

  const client = (sub as any).clients ?? {};
  const vehicle = (sub as any).vehicles ?? {};

  return new Response(
    JSON.stringify({
      folio: sub.folio,
      fecha_vencimiento: sub.fecha_vencimiento,
      estado: sub.estado,
      cliente: client.razon_social || client.nombre_comercial || "Cliente",
      vehiculo: vehicle.patente
        ? `${vehicle.marca ?? ""} ${vehicle.modelo ?? ""} ${vehicle.anio ?? ""} — ${vehicle.patente}`.trim()
        : null,
      plan: selectedPlan
        ? { nombre: selectedPlan.nombre, precio: selectedPlan.precio, periodo_meses: selectedPlan.periodo_meses }
        : null,
      empresa: {
        nombre: getSetting("empresa_razon_social"),
        logo: getSetting("empresa_logo_url"),
        logoDark: getSetting("empresa_logo_dark_url"),
        telefono: getSetting("empresa_telefono"),
        email: getSetting("empresa_email"),
        web: getSetting("empresa_sitio_web"),
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
