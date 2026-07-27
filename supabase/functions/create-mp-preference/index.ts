import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let sub_id: string, plan_id: string | null;
  try {
    const body = await req.json();
    sub_id = body.sub_id;
    plan_id = body.plan_id ?? null;
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (!sub_id) return new Response(JSON.stringify({ error: "sub_id requerido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

  const { data: settings } = await supabase
    .from("settings")
    .select("clave, valor")
    .in("clave", ["mp_access_token", "mp_environment", "app_url"]);

  const getSetting = (k: string) => settings?.find((s: any) => s.clave === k)?.valor ?? "";

  const accessToken = getSetting("mp_access_token");
  const environment = getSetting("mp_environment") || "sandbox";
  const appUrl = getSetting("app_url") || "https://portal.autolock.cl";

  if (!accessToken) {
    return new Response(JSON.stringify({ error: "MercadoPago no está configurado. Ve a Configuración → Integraciones → MercadoPago." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("folio, plan_id, clients!client_id(razon_social, nombre_comercial, email_principal)")
    .eq("id", sub_id)
    .single();

  if (subErr || !sub) return new Response(JSON.stringify({ error: "Suscripción no encontrada" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

  const effectivePlanId = plan_id || (sub as any).plan_id;

  const { data: plan, error: planErr } = await supabase
    .from("subscription_plans")
    .select("nombre, precio, periodo_meses")
    .eq("id", effectivePlanId)
    .single();

  if (planErr || !plan) return new Response(JSON.stringify({ error: "Plan no encontrado" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

  const client = (sub as any).clients ?? {};
  const clientName = client.razon_social || client.nombre_comercial || "Cliente";

  const preference = {
    items: [{
      id: sub_id,
      title: `Suscripción GPS - ${plan.nombre}`,
      description: `Renovación folio ${(sub as any).folio} — ${clientName}`,
      quantity: 1,
      unit_price: Number(plan.precio),
      currency_id: "CLP",
    }],
    payer: {
      name: clientName,
      email: client.email_principal || undefined,
    },
    back_urls: {
      success: `${appUrl}/renovar/success?sub=${sub_id}`,
      failure: `${appUrl}/renovar/failure?sub=${sub_id}`,
      pending: `${appUrl}/renovar/pending?sub=${sub_id}`,
    },
    auto_return: "approved",
    external_reference: `${sub_id}|${effectivePlanId}`,
    notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
    statement_descriptor: "AutoLock GPS",
  };

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });

  const mpData = await mpRes.json();

  if (!mpRes.ok) {
    console.error("MP error:", JSON.stringify(mpData));
    return new Response(JSON.stringify({ error: "Error al crear preferencia de pago", detail: mpData }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const checkoutUrl = environment === "production" ? mpData.init_point : mpData.sandbox_init_point;

  return new Response(JSON.stringify({ checkout_url: checkoutUrl, preference_id: mpData.id }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
