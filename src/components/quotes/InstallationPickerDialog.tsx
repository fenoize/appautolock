import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddressAutocomplete, AddressValue, EMPTY_ADDRESS } from '@/components/shared/AddressAutocomplete';

interface InstallationValue {
  datetime: string; // ISO string con fecha+hora
  address: string;
  comuna?: string;
  region?: string;
  referencia?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: InstallationValue | null;
  onChange: (value: InstallationValue | null) => void;
  woLoad?: Record<string, number>;
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_S = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAY_HEADERS = ['D','L','M','M','J','V','S'];
const DAY_NAMES = ['dom','lun','mar','mié','jue','vie','sáb'];
const TIME_SHORTCUTS = ['07:00','08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

function getLoadColor(count: number) {
  if (count === 0) return null;
  if (count <= 2) return 'bg-green-400';
  if (count <= 4) return 'bg-amber-400';
  return 'bg-red-400';
}

export function InstallationPickerDialog({ open, onOpenChange, value, onChange, woLoad = {} }: Props) {
  const today = new Date(); today.setHours(0,0,0,0);

  const parseInitial = () => {
    if (!value?.datetime) return { date: null as string | null, time: '' };
    const d = new Date(value.datetime);
    const dateStr = d.toISOString().split('T')[0];
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return { date: dateStr, time: `${hh}:${mm}` };
  };

  const initial = parseInitial();
  const [selDate, setSelDate] = useState<string | null>(initial.date);
  const [selTime, setSelTime] = useState(initial.time || '09:00');
  const [address, setAddress] = useState(value?.address || '');
  const [curMonth, setCurMonth] = useState(() => {
    if (initial.date) { const d = new Date(initial.date); return { m: d.getMonth(), y: d.getFullYear() }; }
    return { m: today.getMonth(), y: today.getFullYear() };
  });
  const [calError, setCalError] = useState(false);

  // Sync cuando se abre
  useEffect(() => {
    if (open) {
      const p = parseInitial();
      setSelDate(p.date);
      setSelTime(p.time || '09:00');
      setAddr({
        direccion: value?.address || '',
        comuna: value?.comuna || '',
        region: value?.region || '',
        referencia: value?.referencia || '',
      });
      setCalError(false);
      if (p.date) {
        const d = new Date(p.date);
        setCurMonth({ m: d.getMonth(), y: d.getFullYear() });
      }
    }
  }, [open]);

  const changeMonth = (dir: number) => {
    setCurMonth(prev => {
      let m = prev.m + dir;
      let y = prev.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { m, y };
    });
  };

  const handleSave = () => {
    if (!selDate) { setCalError(true); return; }
    const [h, min] = (selTime || '09:00').split(':').map(Number);
    const dt = new Date(selDate);
    dt.setHours(h, min, 0, 0);
    onChange({
      datetime: dt.toISOString(),
      address: addr.direccion.trim(),
      comuna: addr.comuna.trim(),
      region: addr.region.trim(),
      referencia: addr.referencia.trim(),
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    setSelDate(null);
    setSelTime('09:00');
    setAddr({ ...EMPTY_ADDRESS });
    onChange(null);
    onOpenChange(false);
  };

  // Render calendar
  const firstDay = new Date(curMonth.y, curMonth.m, 1).getDay();
  const daysInMonth = new Date(curMonth.y, curMonth.m + 1, 0).getDate();

  const formatLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    return `${DAY_NAMES[dt.getDay()]} ${d} ${MONTHS_S[m-1]} ${y} · ${selTime} h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            Fecha de instalación
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Calendario */}
          <div className={cn('rounded-md transition-all', calError && 'ring-2 ring-destructive')}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => changeMonth(-1)} className="h-7 w-7 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm font-medium">{MONTHS[curMonth.m]} {curMonth.y}</span>
              <button onClick={() => changeMonth(1)} className="h-7 w-7 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {DAY_HEADERS.map((d,i) => (
                <div key={i} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
              {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} />)}
              {Array.from({length: daysInMonth}).map((_,i) => {
                const d = i + 1;
                const dateStr = `${curMonth.y}-${String(curMonth.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const dateObj = new Date(curMonth.y, curMonth.m, d);
                const isPast = dateObj < today;
                const isToday = dateObj.getTime() === today.getTime();
                const isSel = selDate === dateStr;
                const load = woLoad[dateStr] || 0;
                const dotColor = getLoadColor(load);
                return (
                  <button
                    key={d}
                    disabled={isPast}
                    onClick={() => { setSelDate(dateStr); setCalError(false); }}
                    className={cn(
                      'flex flex-col items-center justify-center rounded py-1 text-xs transition-all',
                      isPast && 'opacity-30 cursor-not-allowed',
                      isSel && 'bg-primary text-primary-foreground font-semibold',
                      isToday && !isSel && 'ring-2 ring-primary ring-offset-1',
                      !isSel && !isPast && 'hover:bg-muted cursor-pointer'
                    )}
                  >
                    <span>{d}</span>
                    {dotColor && (
                      <span className={cn('w-1.5 h-1.5 rounded-full mt-0.5', isSel ? 'bg-primary-foreground/70' : dotColor)} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda carga */}
            <div className="flex gap-3 mt-2 justify-end">
              {[['bg-green-400','libre'],['bg-amber-400','cargado'],['bg-red-400','lleno']].map(([cls, label]) => (
                <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={cn('w-2 h-2 rounded-full', cls)} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {calError && <p className="text-xs text-destructive -mt-2">Selecciona una fecha</p>}

          <div className="border-t" />

          {/* Hora */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
              <Clock className="h-3 w-3" /> Hora
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TIME_SHORTCUTS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelTime(t)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded border transition-all',
                    selTime === t
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Otra hora:</span>
              <input
                type="time"
                value={selTime}
                onChange={e => setSelTime(e.target.value)}
                className="text-xs px-2 py-1 border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>

          <div className="border-t" />

          {/* Dirección */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3 w-3" /> Dirección de instalación <span className="font-normal">(opcional)</span>
            </Label>
            <AddressAutocomplete value={addr} onChange={setAddr} showReferencia />
            <p className="text-[11px] text-muted-foreground mt-1">Si difiere de la dirección del cliente</p>
          </div>

          {/* Preview cuando hay fecha */}
          {selDate && (
            <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-xs text-primary font-medium">
              {formatLabel(selDate)}
              {addr.direccion && (
                <div className="text-muted-foreground font-normal mt-0.5">
                  {[addr.direccion, addr.comuna, addr.region].filter(Boolean).join(', ')}
                </div>
              )}
              {addr.referencia && (
                <div className="text-muted-foreground font-normal mt-0.5">Ref: {addr.referencia}</div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Limpiar
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
