import { supabase } from '@/integrations/supabase/client';

export type QuoteEventType =
  | 'creada'
  | 'enviada'
  | 'en_revision'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'convertida_a_ot'
  | 'pdf_generado'
  | 'nota';

export async function logQuoteEvent(
  quoteId: string,
  tipo: QuoteEventType,
  opts: { notas?: string; metadata?: Record<string, any> } = {},
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('quote_events').insert({
      quote_id: quoteId,
      tipo,
      user_id: user?.id ?? null,
      notas: opts.notas ?? null,
      metadata: opts.metadata ?? null,
    } as any);
  } catch (e) {
    console.error('logQuoteEvent failed', e);
  }
}
