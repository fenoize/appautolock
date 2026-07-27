import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // MP puede enviar como query param (IPN) o como body (webhook)
  const url = new URL(req.url);
  const topicParam = url.searchParams.get("topic") ?? url.searchParams.get("type");
  const idParam = url.searchParams.get("id") ?? url.searchParams.get("data.id");

  let paymentId: string | null = null;

  if (topicParam === "payment" && idParam) {
    paymentId = idParam;
  } else {
    try {
      const body = await req.json();
      if (body.type === "payment") paymentId = body.data?.id?.toString() ?? null;
    } catch { /* body vacío */ }
  }

  if (!paymentId) return new Response("ok", { status: 200 });

  const { data: setting } = await supabase
    .from("settings")
    .select("valor")
    .eq("clave", "mp_access_token")
    .maybeSingle();

  const accessToken = (setting as any)?.valor;
  if (!accessToken) return new Response("no mp token", { status: 503 });

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payment = await paymentRes.json();

  if (payment.status !== "approved") return new Response("ok — not approved", { status: 200 });

  // external_reference = "sub_id|plan_id"
  const ref = payment.external_reference || "";
  const [subId, planId] = ref.split("|");
  if (!subId || !planId) return new Response("bad reference", { status: 200 });

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("precio, periodo_meses")
    .eq("id", planId)
    .maybeSingle();

  if (!plan) return new Response("plan not found", { status: 200 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("fecha_vencimiento, estado")
    .eq("id", subId)
    .maybeSingle();

  if (!sub) return new Response("sub not found", { status: 200 });

  const now = new Date();
  const currentExpiry = new Date((sub as any).fecha_vencimiento + "T00:00:00");
  const baseDate = ((sub as any).estado === "activa" && currentExpiry > now) ? currentExpiry : now;
  baseDate.setMonth(baseDate.getMonth() + (plan as any).periodo_meses);
  const newExpiry = baseDate.toISOString().split("T")[0];

  await supabase
    .from("subscriptions")
    .update({ plan_id: planId, fecha_vencimiento: newExpiry, estado: "activa" })
    .eq("id", subId);

  await supabase.from("subscription_events").insert({
    subscription_id: subId,
    tipo: "pago_recibido",
    notas: `Pago MercadoPago ${paymentId} aprobado por $${payment.transaction_amount ?? plan.precio}. Vencimiento extendido a ${newExpiry}.`,
  });

  await supabase.from("notifications").insert({
    plantilla: "pago_recibido",
    evento: "pago_recibido",
    canal: "email",
    destinatario: payment.payer?.email || "sin-email",
    estado: "enviado",
    enviado_at: new Date().toISOString(),
    payload: { payment_id: paymentId, subscription_id: subId, plan_id: planId, monto: payment.transaction_amount },
  });

  console.log(`✅ Pago aprobado ${paymentId} — sub ${subId} extendida hasta ${newExpiry}`);
  return new Response("ok", { status: 200 });
});
