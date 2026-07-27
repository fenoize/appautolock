import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  apiKey: string,
  from: string
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
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

  const { data: settingsRows } = await supabase
    .from("settings")
    .select("clave, valor")
    .in("clave", ["resend_api_key", "resend_from_email", "resend_from_name", "resend_admin_email"]);

  const getSetting = (key: string) =>
    settingsRows?.find((r: any) => r.clave === key)?.valor ?? "";

  const resendApiKey = getSetting("resend_api_key") || Deno.env.get("RESEND_API_KEY") || "";
  const fromEmail = getSetting("resend_from_email") || "notificaciones@autolock.cl";
  const fromName = getSetting("resend_from_name") || "AutoLock";
  const adminEmail = getSetting("resend_admin_email") || "renovaciones@autolock.cl";
  const fromFull = `${fromName} <${fromEmail}>`;

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const results: { sent: number; errors: number; log: unknown[] } = {
    sent: 0,
    errors: 0,
    log: [],
  };

  const adminLog: { evento: string; folio: string; cliente: string; fecha: string; error?: string }[] = [];

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
          await sendEmail(clientEmail, subject, body, resendApiKey, fromFull);
        }

        await supabase
          .from("subscriptions")
          .update({
            ultima_notificacion_enviada: rule.evento,
            fecha_ultima_notificacion: new Date().toISOString(),
          })
          .eq("id", sub.id);

        results.sent++;
        adminLog.push({ evento: rule.evento, folio: sub.folio, cliente: clientName, fecha: fechaStr });
      } catch (err: any) {
        estadoLog = "error";
        errorMsg = err.message;
        results.errors++;
        adminLog.push({ evento: rule.evento, folio: sub.folio, cliente: clientName, fecha: fechaStr, error: errorMsg ?? undefined });
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

  if (adminEmail && adminLog.length > 0) {
    const hoy = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

    const exitosos = adminLog.filter((l) => !l.error);
    const errores = adminLog.filter((l) => l.error);

    const byEvento: Record<string, typeof exitosos> = {};
    for (const item of exitosos) {
      if (!byEvento[item.evento]) byEvento[item.evento] = [];
      byEvento[item.evento].push(item);
    }

    const eventoLabels: Record<string, string> = {
      recordatorio_30d: "30 días",
      recordatorio_15d: "15 días",
      recordatorio_7d: "7 días",
      recordatorio_1d: "1 día",
      vencimiento: "Vencidos",
      suspension: "Suspendidos",
    };

    let body = `Resumen de recordatorios GPS enviados - ${hoy}\n\n`;
    body += `Se enviaron ${exitosos.length} notificaciones:\n`;

    for (const [evento, items] of Object.entries(byEvento)) {
      body += `\n${eventoLabels[evento] ?? evento}:\n`;
      for (const item of items) {
        body += `- ${item.folio} | ${item.cliente} | vence ${item.fecha}\n`;
      }
    }

    if (errores.length > 0) {
      body += `\nErrores (${errores.length}):\n`;
      for (const item of errores) {
        body += `- ${item.folio} | ${item.cliente} | ${item.error}\n`;
      }
    }

    try {
      await sendEmail(
        adminEmail,
        `[AutoLock GPS] Recordatorios enviados - ${hoy}`,
        body,
        resendApiKey,
        fromFull
      );
    } catch (_) {
      // No bloquear si falla el resumen al admin
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
