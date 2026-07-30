import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sendEmail(
  to: string,
  subject: string,
  content: string,
  apiKey: string,
  from: string
): Promise<void> {
  const isHtml = content.trimStart().startsWith("<!DOCTYPE") || content.trimStart().startsWith("<html");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      ...(isHtml ? { html: content } : { text: content }),
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

/** Supports both simple {{key}} and dot-notation {{a.b}} variables */
function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? `{{${key}}}`);
}

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: settingsRows } = await supabase
    .from("settings")
    .select("clave, valor")
    .in("clave", [
      "resend_api_key", "resend_from_email", "resend_from_name",
      "resend_admin_email", "app_url",
      "empresa_telefono", "empresa_email",
    ]);

  const getSetting = (key: string) =>
    settingsRows?.find((r: any) => r.clave === key)?.valor ?? "";

  const resendApiKey = getSetting("resend_api_key") || Deno.env.get("RESEND_API_KEY") || "";
  const fromEmail = getSetting("resend_from_email") || "notificaciones@autolock.cl";
  const fromName  = getSetting("resend_from_name")  || "AutoLock";
  const adminEmail = getSetting("resend_admin_email");
  const fromFull   = `${fromName} <${fromEmail}>`;
  const appUrl     = getSetting("app_url") || "https://portal.autolock.cl";

  // Phone digits-only for wa.me links (e.g. "+56 9 2178 3957" → "56921783957")
  const empresaTelefono = getSetting("empresa_telefono").replace(/[^0-9]/g, "");
  const empresaEmail    = getSetting("empresa_email") || "contacto@autolock.cl";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const results: { sent: number; errors: number; log: unknown[] } = { sent: 0, errors: 0, log: [] };
  const adminLog: { evento: string; folio: string; cliente: string; fecha: string; error?: string }[] = [];

  // Load active email reminder rules
  const { data: rules, error: rulesErr } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("activo", true)
    .eq("canal_preferido", "email");

  if (rulesErr || !rules?.length) {
    return new Response(JSON.stringify({ message: "Sin reglas activas", results }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  for (const rule of rules) {
    // Target date = today + days_before
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + rule.dias_previos);
    const dateStr = target.toISOString().split("T")[0];

    // Fetch subscriptions expiring on target date, including client, plan, and vehicle
    const { data: subs } = await supabase
      .from("subscriptions")
      .select(`
        id, folio, plan_id, fecha_vencimiento, ultima_notificacion_enviada,
        clients!client_id(razon_social, email_principal),
        subscription_plans!plan_id(nombre, precio),
        vehicles!vehicle_id(patente, marca, modelo)
      `)
      .eq("estado", "activa")
      .eq("fecha_vencimiento", dateStr);

    if (!subs?.length) continue;

    // Skip subscriptions that already received this specific reminder
    const pendientes = subs.filter((s) => s.ultima_notificacion_enviada !== rule.evento);
    if (!pendientes.length) continue;

    // Get email template for this event
    const { data: template } = await supabase
      .from("notification_templates")
      .select("id, asunto, cuerpo")
      .eq("evento", rule.evento)
      .eq("canal", "email")
      .eq("activa", true)
      .maybeSingle();

    if (!template) continue;

    for (const sub of pendientes) {
      const client  = sub.clients as any;
      const plan    = sub.subscription_plans as any;
      const vehicle = sub.vehicles as any;

      const clientEmail  = client?.email_principal ?? null;
      const clientName   = client?.razon_social || "Cliente";
      const planName     = plan?.nombre || "GPS";
      const planPrecio   = plan?.precio
        ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(plan.precio))
        : "";
      const vehiculoStr  = vehicle ? `${vehicle.marca ?? ""} ${vehicle.modelo ?? ""}`.trim() || "-" : "-";
      const patente      = vehicle?.patente ?? "-";

      const linkRenovacion = `${appUrl}/renovar?sub=${sub.id}&plan=${sub.plan_id ?? ""}`;

      const fechaVenc = new Date(sub.fecha_vencimiento + "T00:00:00");
      const fechaStr  = fechaVenc.toLocaleDateString("es-CL", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });

      // All variables the templates can reference
      const vars: Record<string, string> = {
        // Simple keys
        nombre_cliente:    clientName,
        folio:             sub.folio,
        fecha_vencimiento: fechaStr,
        dias_restantes:    String(rule.dias_previos),
        plan_nombre:       planName,
        precio:            planPrecio,
        link_renovacion:   linkRenovacion,
        vehiculo:          vehiculoStr,
        patente:           patente,
        // Dot-notation keys (used in HTML templates)
        "cliente.razon_social": clientName,
        "plan.nombre":          planName,
        "empresa.telefono":     empresaTelefono,
        "empresa.email":        empresaEmail,
      };

      const subject = renderTemplate(template.asunto, vars);
      const body    = renderTemplate(template.cuerpo, vars);

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
        errorMsg  = err.message;
        results.errors++;
        adminLog.push({ evento: rule.evento, folio: sub.folio, cliente: clientName, fecha: fechaStr, error: errorMsg ?? undefined });
      }

      await supabase.from("notifications").insert({
        plantilla:    template.id,
        canal:        "email",
        evento:       rule.evento,
        destinatario: clientEmail ?? "sin_email",
        estado:       estadoLog,
        payload:      { folio: sub.folio, cliente: clientName, dias: rule.dias_previos },
        enviado_at:   estadoLog === "enviado" ? new Date().toISOString() : null,
        error_message: errorMsg,
      });

      results.log.push({
        folio: sub.folio, evento: rule.evento,
        email: clientEmail, estado: estadoLog, error: errorMsg,
      });
    }
  }

  // Send daily summary to admin
  if (adminEmail && adminLog.length > 0) {
    const hoy = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const exitosos = adminLog.filter((l) => !l.error);
    const errores  = adminLog.filter((l) => l.error);

    const byEvento: Record<string, typeof exitosos> = {};
    for (const item of exitosos) {
      (byEvento[item.evento] ??= []).push(item);
    }

    const eventoLabels: Record<string, string> = {
      recordatorio_30d: "30 días",
      recordatorio_10d: "10 días",
      recordatorio_7d:  "7 días",
      recordatorio_1d:  "1 día",
      vencimiento:      "Vencidos",
      suspension:       "Suspendidos",
    };

    let resumen = `Resumen de recordatorios GPS - ${hoy}\n\nEnviados: ${exitosos.length}\n`;
    for (const [evento, items] of Object.entries(byEvento)) {
      resumen += `\n${eventoLabels[evento] ?? evento}:\n`;
      for (const item of items) resumen += `  - ${item.folio} | ${item.cliente} | vence ${item.fecha}\n`;
    }
    if (errores.length > 0) {
      resumen += `\nErrores (${errores.length}):\n`;
      for (const item of errores) resumen += `  - ${item.folio} | ${item.cliente} | ${item.error}\n`;
    }

    try {
      await sendEmail(adminEmail, `[AutoLock GPS] Recordatorios enviados - ${hoy}`, resumen, resendApiKey, fromFull);
    } catch (_) { /* no bloquear si falla el resumen */ }
  }

  return new Response(JSON.stringify(results), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
