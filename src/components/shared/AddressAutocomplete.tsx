import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export interface AddressValue {
  direccion: string;
  comuna: string;
  region: string;
  referencia: string;
}

export const EMPTY_ADDRESS: AddressValue = {
  direccion: '',
  comuna: '',
  region: '',
  referencia: '',
};

interface Suggestion {
  id: string;
  direccion: string;
  comuna: string;
  region: string;
  label: string;
}

interface Props {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  showReferencia?: boolean;
  required?: boolean;
  disabled?: boolean;
}

function parseFeature(f: any): { direccion: string; comuna: string; region: string } {
  const street = f.text || '';
  const number = f.address || '';
  const direccion = number ? `${street} ${number}` : street;
  let comuna = '';
  let region = '';
  (f.context || []).forEach((ctx: any) => {
    if (typeof ctx?.id !== 'string') return;
    if (ctx.id.startsWith('place.')) comuna = ctx.text;
    if (ctx.id.startsWith('region.')) region = ctx.text;
  });
  return { direccion, comuna, region };
}

export function AddressAutocomplete({
  value,
  onChange,
  showReferencia = true,
  required = false,
  disabled = false,
}: Props) {
  const [inputVal, setInputVal] = useState(value.direccion);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDropdownPos = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    if (open) {
      updateDropdownPos();
      const onScroll = () => updateDropdownPos();
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
      return () => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
      };
    }
    return undefined;
  }, [open]);

  const prevDir = useRef(value.direccion);
  if (value.direccion !== prevDir.current && value.direccion !== inputVal) {
    setInputVal(value.direccion);
    prevDir.current = value.direccion;
  } else if (value.direccion !== prevDir.current) {
    prevDir.current = value.direccion;
  }

  const search = useCallback(async (q: string) => {
    if (!MAPBOX_TOKEN || q.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q,
      )}.json?country=CL&language=es&types=address&limit=5&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      const list: Suggestion[] = (data.features || []).map((f: any) => ({
        id: f.id,
        ...parseFeature(f),
        label: f.place_name as string,
      }));
      setSuggestions(list);
      setOpen(list.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setInputVal(q);
    prevDir.current = q;
    onChange({ ...value, direccion: q });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      search(q);
      updateDropdownPos();
    }, 320);
  };

  const handleSelect = (s: Suggestion) => {
    prevDir.current = s.direccion;
    setInputVal(s.direccion);
    setSuggestions([]);
    setOpen(false);
    onChange({ ...value, direccion: s.direccion, comuna: s.comuna, region: s.region });
  };

  const handleFocus = () => {
    updateDropdownPos();
    if (suggestions.length > 0) setOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Dirección */}
      <div className="space-y-1.5">
        <Label>
          Dirección{required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={inputVal}
            onChange={handleInput}
            onBlur={() => setTimeout(() => setOpen(false), 160)}
            onFocus={handleFocus}
            placeholder="Av. Providencia 1234"
            className="pl-9 pr-8"
            disabled={disabled}
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {open && suggestions.length > 0 && dropdownPos && createPortal(
            <div
              className="bg-popover border border-border rounded-md shadow-md overflow-hidden"
              style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => handleSelect(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors border-b border-border last:border-0 flex items-start gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.direccion}</div>
                    <div className="text-xs text-muted-foreground">
                      {[s.comuna, s.region].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>,
            document.body,
          )}
        </div>
      </div>

      {/* Comuna + Región */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>
            Comuna{required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            value={value.comuna}
            onChange={(e) => onChange({ ...value, comuna: e.target.value })}
            placeholder="Providencia"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Región{required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            value={value.region}
            onChange={(e) => onChange({ ...value, region: e.target.value })}
            placeholder="Región Metropolitana de Santiago"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Referencia */}
      {showReferencia && (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground font-normal">
            Referencia <span className="text-xs">(opcional)</span>
          </Label>
          <Input
            value={value.referencia}
            onChange={(e) => onChange({ ...value, referencia: e.target.value })}
            placeholder="Ej: frente al Jumbo, portón azul, piso 3..."
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
