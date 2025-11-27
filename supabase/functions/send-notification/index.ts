import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers para formateo
function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function processTemplate(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path.trim());
    
    if (value === undefined || value === null) {
      return match;
    }
    
    // Formateo especial según tipo de dato
    if (path.includes('total') || path.includes('precio') || path.includes('monto')) {
      return formatCurrency(value);
    }
    
    if (path.includes('fecha')) {
      return formatDate(value);
    }
    
    return String(value);
  });
}

function evaluateConditions(conditions: any[], data: any): boolean {
  if (!conditions || conditions.length === 0) return true;
  
  return conditions.every(condition => {
    if (!condition.activo) return true;
    
    const value = getNestedValue(data, condition.campo);
    const compareValue = condition.valor;
    
    switch (condition.operador) {
      case 'mayor_que':
        return parseFloat(value) > parseFloat(compareValue);
      case 'menor_que':
        return parseFloat(value) < parseFloat(compareValue);
      case 'igual_a':
        return String(value).toLowerCase() === String(compareValue).toLowerCase();
      case 'contiene':
        return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
      default:
        return true;
    }
  });
}

function sanitizeHtml(html: string): string {
  // Remover tags peligrosos
  const dangerous = ['script', 'iframe', 'object', 'embed', 'form'];
  let clean = html;
  
  dangerous.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
    clean = clean.replace(regex, '');
    clean = clean.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
  });
  
  return clean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { evento, data, recipient } = await req.json();

    console.log("Processing notification:", { evento, recipient });

    // 1. Obtener template activo para el evento
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*, notification_conditions(*)')
      .eq('evento', evento)
      .eq('activa', true)
      .eq('canal', 'email')
      .single();

    if (templateError || !template) {
      console.error("Template not found or inactive:", evento);
      throw new Error(`No active template found for event: ${evento}`);
    }

    // 2. Evaluar condiciones si existen
    const conditions = template.notification_conditions || [];
    if (!evaluateConditions(conditions, data)) {
      console.log("Conditions not met, skipping notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Conditions not met" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Procesar variables en asunto y cuerpo
    const processedSubject = processTemplate(template.asunto || '', data);
    const processedBody = template.html_content 
      ? sanitizeHtml(processTemplate(template.html_content, data))
      : processTemplate(template.cuerpo, data);

    // 4. Enviar email vía Resend
    console.log("Sending email to:", recipient);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Sistema Autolock <notificaciones@resend.dev>", // Cambiar cuando tenga dominio verificado
      to: [recipient],
      subject: processedSubject,
      html: template.html_content ? processedBody : `<pre>${processedBody}</pre>`,
    });

    let emailStatus = 'enviada';
    let emailWarning = null;

    if (emailError) {
      console.error("Resend error:", emailError);
      emailStatus = 'fallida';
      emailWarning = emailError.message || 'Error al enviar email';
      
      // If it's a domain verification error, don't fail the whole operation
      if (emailError.message?.includes('verify a domain')) {
        console.log("Domain not verified - notification logged but not sent");
      } else {
        // For other errors, we might want to fail
        throw emailError;
      }
    }

    console.log("Email sent successfully:", emailData);

    // 5. Registrar en tabla notifications
    const { error: logError } = await supabase
      .from('notifications')
      .insert({
        evento,
        destinatario: recipient,
        canal: 'email',
        plantilla: template.id,
        payload: data,
        estado: emailStatus,
        enviado_at: emailStatus === 'enviada' ? new Date().toISOString() : null,
      });

    if (logError) {
      console.error("Failed to log notification:", logError);
      // No throw, email ya se envió
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailData?.id,
        template: template.evento,
        warning: emailWarning,
        emailSent: emailStatus === 'enviada'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in send-notification:", error);
    
    // Intentar registrar el fallo
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { evento, data, recipient } = await req.json();
      
      await supabase
        .from('notifications')
        .insert({
          evento,
          destinatario: recipient,
          canal: 'email',
          payload: data,
          estado: 'fallida',
        });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
