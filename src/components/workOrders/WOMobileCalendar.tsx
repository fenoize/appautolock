import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkOrder, WOStatus } from '@/types/workOrders';

interface Props {
  workOrders: WorkOrder[];
}

const statusColors: Record<WOStatus, string> = {
  pendiente: '#94a3b8',
  asignada: '#3b82f6',
  programada: '#8b5cf6',
  en_ruta: '#f59e0b',
  en_proceso: '#10b981',
  pausada: '#f97316',
  reprogramada: '#ec4899',
  completada: '#22c55e',
  cancelada: '#ef4444',
};

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 56; // px
const TIME_COL_WIDTH = 56; // px

export function WOMobileCalendar({ workOrders }: Props) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick current-time line
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll to current hour on mount or when date is today
  useEffect(() => {
    if (!scrollRef.current) return;
    const isToday = isSameDay(selectedDate, new Date());
    const targetHour = isToday ? now.getHours() : 9;
    const top = Math.max(0, (targetHour - START_HOUR) * HOUR_HEIGHT - 80);
    scrollRef.current.scrollTo({ top, behavior: 'smooth' });
  }, [selectedDate]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const dayEvents = useMemo(() => {
    return workOrders
      .filter((wo) => wo.fecha_programada)
      .filter((wo) => isSameDay(new Date(wo.fecha_programada!), selectedDate))
      .map((wo) => {
        const start = new Date(wo.fecha_programada!);
        const end = wo.ventana_fin
          ? new Date(wo.ventana_fin)
          : new Date(start.getTime() + 60 * 60 * 1000);
        return { wo, start, end };
      });
  }, [workOrders, selectedDate]);

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );

  const minutesFromStart = (d: Date) =>
    (d.getHours() - START_HOUR) * 60 + d.getMinutes();

  const nowTop =
    isSameDay(selectedDate, now) &&
    now.getHours() >= START_HOUR &&
    now.getHours() <= END_HOUR
      ? (minutesFromStart(now) / 60) * HOUR_HEIGHT
      : null;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] rounded-xl border bg-card overflow-hidden">
      {/* Month + nav */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-base font-bold capitalize">
          {format(selectedDate, "MMMM yyyy", { locale: es })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d) => {
          const selected = isSameDay(d, selectedDate);
          const today = isSameDay(d, now);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelectedDate(d)}
              className="flex flex-col items-center gap-1 py-2 active:bg-muted/40"
            >
              <span className="text-[11px] uppercase text-muted-foreground">
                {format(d, 'EEE', { locale: es }).slice(0, 3)}
              </span>
              <span
                className={
                  selected
                    ? 'h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold bg-primary text-primary-foreground'
                    : today
                    ? 'h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold text-primary'
                    : 'h-7 w-7 flex items-center justify-center text-sm text-foreground'
                }
              >
                {format(d, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div
          className="relative"
          style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
        >
          {/* Hours rows */}
          {hours.map((h, idx) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-border/60"
              style={{ top: idx * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <div
                className="absolute left-0 top-0 -translate-y-1/2 text-[11px] text-muted-foreground pl-2"
                style={{ width: TIME_COL_WIDTH }}
              >
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
              </div>
            </div>
          ))}

          {/* Events */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: TIME_COL_WIDTH, right: 8 }}
          >
            {dayEvents.map(({ wo, start, end }) => {
              const top = (minutesFromStart(start) / 60) * HOUR_HEIGHT;
              const duration = Math.max(
                30,
                (end.getTime() - start.getTime()) / 60000
              );
              const height = (duration / 60) * HOUR_HEIGHT - 4;
              const color = statusColors[wo.estado];
              return (
                <button
                  key={wo.id}
                  onClick={() => navigate(`/work-orders/${wo.id}`)}
                  className="absolute left-0 right-0 rounded-md text-left px-2 py-1 overflow-hidden text-white shadow-sm active:opacity-80"
                  style={{
                    top,
                    height,
                    backgroundColor: color,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div className="text-[11px] font-semibold truncate">{wo.folio}</div>
                  <div className="text-[10px] truncate opacity-90">
                    {wo.client?.razon_social || wo.client?.nombre_comercial || 'Sin cliente'}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                  </div>
                </button>
              );
            })}

            {/* Now indicator */}
            {nowTop !== null && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none"
                style={{ top: nowTop }}
              >
                <div className="h-2 w-2 rounded-full bg-destructive -ml-1" />
                <div className="flex-1 h-[2px] bg-destructive" />
              </div>
            )}
          </div>
        </div>

        {dayEvents.length === 0 && (
          <div className="absolute bottom-3 left-0 right-0 text-center text-sm text-muted-foreground">
            No hay OTs programadas
          </div>
        )}
      </div>
    </div>
  );
}
