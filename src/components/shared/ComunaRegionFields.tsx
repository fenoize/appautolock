import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGIONES, getComunasByRegion, getRegionByComuna } from '@/lib/chile-locations';

interface ComunaRegionFieldsProps {
  region: string;
  comuna: string;
  onRegionChange: (region: string) => void;
  onComunaChange: (comuna: string) => void;
  /** Wrapper class for the outer grid. Defaults to "grid grid-cols-2 gap-2" */
  className?: string;
}

/**
 * Cascading Region → Comuna selects for Chilean addresses.
 * Selecting a region clears the current comuna if it no longer belongs to it.
 */
export function ComunaRegionFields({
  region,
  comuna,
  onRegionChange,
  onComunaChange,
  className = 'grid grid-cols-2 gap-2',
}: ComunaRegionFieldsProps) {
  const comunasForRegion = region ? getComunasByRegion(region) : [];

  // Auto-detect region from an existing stored comuna (backward compat)
  useEffect(() => {
    if (comuna && !region) {
      const detected = getRegionByComuna(comuna);
      if (detected) onRegionChange(detected);
    }
  }, []);

  const handleRegionChange = (val: string) => {
    onRegionChange(val);
    // Clear comuna only if it no longer belongs to the new region
    const comunasInNewRegion = getComunasByRegion(val);
    if (comuna && !comunasInNewRegion.includes(comuna)) {
      onComunaChange('');
    }
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label>Región *</Label>
        <Select value={region || undefined} onValueChange={handleRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona región" />
          </SelectTrigger>
          <SelectContent>
            {REGIONES.map((r) => (
              <SelectItem key={r.nombre} value={r.nombre}>
                {r.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Comuna *</Label>
        <Select
          value={comuna || undefined}
          onValueChange={onComunaChange}
          disabled={!region}
        >
          <SelectTrigger>
            <SelectValue placeholder={region ? 'Selecciona comuna' : 'Primero elige región'} />
          </SelectTrigger>
          <SelectContent>
            {comunasForRegion.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
