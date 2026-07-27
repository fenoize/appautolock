import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "renovaciones@autolock.cl";
const FROM_EMAIL = "notificaciones@autolock.cl";

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `AutoLock <${FROM_EMAIL}>`,
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const results: { sent: number; errors: number; log: unknown[] } = {
    sent: 0,
    errors: 0,
    log: [],
  };

  // 1. Cargar reglas activas de recordatorio por email
  const { data: rules, error: rulesErr } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("activo", true)
    .eq("canal_preferido", "email");

  if (rulesErr || !rules?.length) {
    return new Response(JSON.stringify({ message: "Sin reglas activas", results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const rule of rules) {
    // Calcular fecha objetivo
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + rule.dias_previos);
    const dateStr = target.toISOString().split("T")[0];

    // 2. Buscar suscripciones activas que vencen ese día
    const { data: subs } = await supabase
      .from("subscriptions")
      .select(
        `id, folio, fecha_vencimiento, ultima_notificacion_enviada,
         clients!client_id(razon_social, email_principal),
         subscription_plans!plan_id(nombre)`
      )
      .eq("estado", "activa")
      .eq("fecha_vencimiento", dateStr);

    if (!subs?.length) continue;

    const pendientes = subs.filter(
      (s) => s.ultima_notificacion_enviada !== rule.evento
    );

    if (!pendientes.length) continue;

    // 3. Obtener template de email para este evento
    const { data: template } = await supabase
      .from("notification_templates")
      .select("*")
      .eq("evento", rule.evento)
      .eq("canal", "email")
      .eq("activa", true)
      .maybeSingle();

    if (!template) continue;

    for (const sub of pendientes) {
      const client = sub.clients as any;
      const plan = sub.subscription_plans as any;
      const clientEmail: string | null = client?.email_principal ?? null;
      const clientName: string = client?.razon_social || "Cliente";
      const planName: string = plan?.nombre || "GPS";

      const fechaVenc = new Date(sub.fecha_vencimiento + "T00:00:00");
      const fechaStr = fechaVenc.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const vars: Record<string, string> = {
        nombre_cliente: clientName,
        folio: sub.folio,
        fecha_vencimiento: fechaStr,
        dias_restantes: String(rule.dias_previos),
        plan_nombre: planName,
      };

      const subject = renderTemplate(template.asunto, vars);
      const body = renderTemplate(template.cuerpo, vars);

      let estadoLog: "enviado" | "error" = "enviado";
      let errorMsg: string | null = null;

      try {
        if (clientEmail) {
          await sendEmail(clientEmail, subject, body);
        }

        const adminSubject = `[Admin GPS] ${subject} — ${clientName}`;
        await sendEmail(ADMIN_EMAIL, adminSubject, body);

        await supabase
          .from("subscriptions")
          .update({
            ultima_notificacion_enviada: rule.evento,
            fecha_ultima_notificacion: new Date().toISOString(),
          })
          .eq("id", sub.id);

        results.sent++;
      } catch (err: any) {
        estadoLog = "error";
        errorMsg = err.message;
        results.errors++;
      }

      await supabase.from("notifications").insert({
        plantilla: template.id,
        canal: "email",
        evento: rule.evento,
        destinatario: clientEmail ?? "sin_email",
        estado: estadoLog,
        payload: { folio: sub.folio, cliente: clientName, dias: rule.dias_previos },
        enviado_at: estadoLog === "enviado" ? new Date().toISOString() : null,
        error_message: errorMsg,
      });

      results.log.push({
        folio: sub.folio,
        evento: rule.evento,
        email: clientEmail,
        estado: estadoLog,
        error: errorMsg,
      });
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
