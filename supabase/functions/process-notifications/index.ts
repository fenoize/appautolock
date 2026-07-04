import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing notification queue...");

    const { data: pending, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('estado', 'pendiente')
      .limit(50);

    if (fetchError) throw fetchError;

    console.log(`Found ${pending?.length || 0} pending notifications`);

    let processed = 0;
    let failed = 0;

    for (const notification of pending || []) {
      try {
        const { data: result, error: sendError } = await supabase.functions.invoke('send-notification', {
          body: {
            evento: notification.evento,
            data: notification.payload,
            recipient: notification.destinatario,
          },
        });

        if (sendError) throw sendError;

        await supabase
          .from('notifications')
          .update({
            estado: 'enviado',
            enviado_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', notification.id);

        processed++;
      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error);
        await supabase
          .from('notifications')
          .update({
            estado: 'fallido',
            error_message: (error?.message || String(error)).slice(0, 500),
          })
          .eq('id', notification.id);
        failed++;
      }
    }

    console.log(`Queue processing complete: ${processed} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: pending?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
