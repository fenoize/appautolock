import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyMPSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string,
): Promise<boolean> {
  if (!xSignature || !secret) return false;

  // Parse "ts=1234567890,v1=abc123..."
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const template = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(template));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === v1;
}

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Load MP settings once
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("clave, valor")
    .in("clave", ["mp_access_token", "mp_webhook_secret"]);

  const getSetting = (k: string) =>
    settingsRows?.find((s: any) => s.clave === k)?.valor ?? "";
  const accessToken = getSetting("mp_access_token");
  const webhookSecret = getSetting("mp_webhook_secret");

  if (!accessToken) return new Response("no mp token", { status: 503 });

  // Determine notification format: IPN (query params) vs Webhook (body)
  const url = new URL(req.url);
  const topicParam = url.searchParams.get("topic") ?? url.searchParams.get("type");
  const idParam = url.searchParams.get("id") ?? url.searchParams.get("data.id");

  let paymentId: string | null = null;
  let isWebhook = false;

  if (topicParam === "payment" && idParam) {
    // Old IPN format — no signature
    paymentId = idParam;
  } else {
    // New webhook format — read raw body for signature verification
    let body: any;
    try {
      const rawBody = await req.text();
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return new Response("ok", { status: 200 });
    }

    if (body.type === "payment") {
      paymentId = body.data?.id?.toString() ?? null;
      isWebhook = true;
    }
  }

  if (!paymentId) return new Response("ok", { status: 200 });

  // Verify MP signature for webhook notifications
  if (isWebhook && webhookSecret) {
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const valid = await verifyMPSignature(xSignature, xRequestId, paymentId, webhookSecret);
    if (!valid) {
      console.warn("⚠️ mp-webhook: firma inválida — posible request falso");
      return new Response("invalid signature", { status: 401 });
    }
  }

  // Verify payment status with MP API
  const paymentRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const payment = await paymentRes.json();

  if (payment.status !== "approved") {
    return new Response("ok — not approved", { status: 200 });
  }

  // external_reference = "sub_id|plan_id"
  const ref = payment.external_reference || "";
  const [subId, planId] = ref.split("|");
  if (!subId || !planId) return new Response("bad reference", { status: 200 });

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("nombre, precio, periodo_meses")
    .eq("id", planId)
    .maybeSingle();

  if (!plan) return new Response("plan not found", { status: 200 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(`
      folio, fecha_vencimiento, estado,
      clients!client_id(razon_social, nombre_comercial, email_principal)
    `)
    .eq("id", subId)
    .maybeSingle();

  if (!sub) return new Response("sub not found", { status: 200 });

  // Calculate new expiry date
  const now = new Date();
  const currentExpiry = new Date((sub as any).fecha_vencimiento + "T00:00:00");
  const baseDate =
    (sub as any).estado === "activa" && currentExpiry > now ? currentExpiry : now;
  baseDate.setMonth(baseDate.getMonth() + (plan as any).periodo_meses);
  const newExpiry = baseDate.toISOString().split("T")[0];

  // Update subscription
  await supabase
    .from("subscriptions")
    .update({ plan_id: planId, fecha_vencimiento: newExpiry, estado: "activa" })
    .eq("id", subId);

  // Log event for audit
  await supabase.from("subscription_events").insert({
    subscription_id: subId,
    tipo: "pago_recibido",
    notas: `Pago MercadoPago ${paymentId} aprobado por $${payment.transaction_amount ?? plan.precio}. Vencimiento extendido a ${newExpiry}.`,
  });

  // Send confirmation email to client
  const client = (sub as any).clients ?? {};
  const clientEmail = payment.payer?.email || client.email_principal;
  const clientName = client.razon_social || client.nombre_comercial || "Cliente";
  const folio = (sub as any).folio;

  if (clientEmail) {
    const newExpiryFormatted = new Date(newExpiry + "T00:00:00").toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const monto = payment.transaction_amount
      ? new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
          maximumFractionDigits: 0,
        }).format(payment.transaction_amount)
      : `$${(plan.precio as number).toLocaleString("es-CL")}`;

    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        recipient: clientEmail,
        data: {
          subject: `✅ Pago recibido — Suscripción GPS ${folio}`,
          body:
            `Estimado/a ${clientName},\n\n` +
            `Hemos recibido tu pago de ${monto} por el plan ${plan.nombre}.\n\n` +
            `Tu suscripción GPS (${folio}) ha sido renovada exitosamente.\n` +
            `Nuevo vencimiento: ${newExpiryFormatted}.\n\n` +
            `Gracias por confiar en AutoLock GPS.`,
        },
      }),
    }).catch((e) => console.error("Error enviando email de confirmación:", e));
  }

  console.log(`✅ Pago aprobado ${paymentId} — sub ${subId} extendida hasta ${newExpiry}`);
  return new Response("ok", { status: 200 });
});
