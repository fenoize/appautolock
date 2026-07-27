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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { recipient, evento, data } = body;

  if (!recipient) {
    return new Response(JSON.stringify({ error: "recipient requerido" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Leer config de Resend desde settings
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("clave, valor")
    .in("clave", ["resend_api_key", "resend_from_email", "resend_from_name"]);

  const getSetting = (key: string) =>
    settingsRows?.find((r: any) => r.clave === key)?.valor ?? "";

  const apiKey = getSetting("resend_api_key") || Deno.env.get("RESEND_API_KEY") || "";
  const fromEmail = getSetting("resend_from_email") || "notificaciones@autolock.cl";
  const fromName = getSetting("resend_from_name") || "AutoLock";

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada en Integraciones" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let subject: string;
  let emailBody: string;

  if (data?.subject && data?.body) {
    // Modo libre — asunto y cuerpo vienen directamente
    subject = data.subject;
    emailBody = data.body;
  } else {
    // Modo template — buscar por evento
    if (!evento) {
      return new Response(JSON.stringify({ error: "evento o data.subject+body requeridos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: template } = await supabase
      .from("notification_templates")
      .select("asunto, cuerpo")
      .eq("evento", evento)
      .eq("canal", "email")
      .eq("activa", true)
      .maybeSingle();

    if (!template) {
      return new Response(JSON.stringify({ error: `Template '${evento}' no encontrado o inactivo` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clpFormat = (n: number) =>
      new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

    const vars: Record<string, string> = {
      nombre_cliente: data?.nombre_cliente ?? "",
      folio: data?.folio ?? "",
      fecha_vencimiento: data?.fecha_vencimiento ?? "",
      dias_restantes: String(data?.dias_restantes ?? ""),
      plan_nombre: data?.plan_nombre ?? "",
      precio: data?.precio ? clpFormat(Number(data.precio)) : "",
      link_renovacion: data?.link_renovacion ?? "",
    };

    const render = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

    subject = render(template.asunto ?? "");
    emailBody = render(template.cuerpo ?? "");
  }

  // Enviar via Resend
  let resendError: string | null = null;
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [recipient],
      subject,
      text: emailBody,
    }),
  });

  if (!sendRes.ok) {
    resendError = await sendRes.text();
  }

  // Registrar en notifications
  await supabase.from("notifications").insert({
    canal: "email",
    evento: evento ?? "manual",
    plantilla: evento ?? "manual",
    destinatario: recipient,
    estado: resendError ? "fallido" : "enviado",
    payload: { subject },
    enviado_at: resendError ? null : new Date().toISOString(),
    error_message: resendError,
  });

  if (resendError) {
    return new Response(JSON.stringify({ error: resendError }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, subject, to: recipient }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
