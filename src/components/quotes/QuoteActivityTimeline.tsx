import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

const ICONS: Record<string, string> = {
  creada: '📄',
  enviada: '📧',
  en_revision: '🔍',
  aceptada: '✅',
  rechazada: '❌',
  cancelada: '🚫',
  convertida_a_ot: '🔧',
  pdf_generado: '📑',
  nota: '📝',
};

const LABELS: Record<string, string> = {
  creada: 'Cotización creada',
  enviada: 'Cotización enviada',
  en_revision: 'Marcada en revisión',
  aceptada: 'Cotización aceptada',
  rechazada: 'Cotización rechazada',
  cancelada: 'Cotización cancelada',
  convertida_a_ot: 'Convertida a OT',
  pdf_generado: 'PDF generado',
  nota: 'Nota agregada',
};

interface QuoteEvent {
  id: string;
  tipo: string;
  notas?: string | null;
  metadata?: any;
  created_at: string;
  user?: { nombre?: string; apellido?: string } | null;
}

interface Props {
  events?: QuoteEvent[];
}

export function QuoteActivityTimeline({ events }: Props) {
  const sorted = [...(events || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Historial de actividad</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No hay actividad registrada
        </p>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-5">
          {sorted.map((ev) => (
            <li key={ev.id} className="ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border text-sm">
                {ICONS[ev.tipo] || '•'}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{LABELS[ev.tipo] || ev.tipo}</p>
                <time className="text-xs text-muted-foreground">
                  {format(new Date(ev.created_at), 'dd/MM/yyyy HH:mm')}
                </time>
              </div>
              {ev.user && (ev.user.nombre || ev.user.apellido) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  por {ev.user.nombre} {ev.user.apellido || ''}
                </p>
              )}
              {ev.notas && (
                <p className="text-sm mt-1 whitespace-pre-wrap">{ev.notas}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
