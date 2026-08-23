import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useVehicleMarcas,
  useVehicleModelos,
  type VehicleCatalog,
} from '@/hooks/useCompatibility';
import { AddCatalogEntryDialog } from './AddCatalogEntryDialog';

export interface CatalogVehicleValue {
  marca: string;
  modelo: string;
  anio?: number;
  combustible?: string;
  tipo_encendido?: string;
}

interface Props {
  value: CatalogVehicleValue;
  onChange: (v: CatalogVehicleValue) => void;
  /** When true, marca/modelo are shown but disabled (e.g. when editing an existing vehicle whose model is no longer in the catalog). */
  allowAdd?: boolean;
  className?: string;
}

const normalize = (s?: string | null) => (s ?? '').trim().toLowerCase();

export function CatalogVehiclePicker({ value, onChange, allowAdd = true, className }: Props) {
  const { data: marcas = [], isLoading: isLoadingMarcas } = useVehicleMarcas();
  const { data: modelosForMarca = [], isLoading: isLoadingModelos } = useVehicleModelos(
    value.marca,
  );
  const [marcaOpen, setMarcaOpen] = useState(false);
  const [modeloOpen, setModeloOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addSeed, setAddSeed] = useState<{ marca?: string; modelo?: string }>({});

  const { data: catalogEntry } = useQuery({
    queryKey: ['vehicle_entry', value.marca, value.modelo],
    enabled: !!value.marca && !!value.modelo,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vehicle_catalog')
        .select('*')
        .eq('marca', value.marca)
        .eq('modelo', value.modelo)
        .limit(1)
        .single();
      if (error) return null;
      return data as VehicleCatalog;
    },
  });

  const applyEntry = (entry: VehicleCatalog | undefined | null, partial: Partial<CatalogVehicleValue>) => {
    const next: CatalogVehicleValue = { ...value, ...partial };
    if (entry) {
      if (entry.tipo_combustible && entry.tipo_combustible !== 'Cualquiera') {
        next.combustible = entry.tipo_combustible;
      }
      if (entry.tipo_encendido && entry.tipo_encendido !== 'Cualquiera') {
        // vehicles.tipo_encendido constraint: Llave | Push-Start | Sin llave | Desconocido
        next.tipo_encendido = entry.tipo_encendido;
      }
      if (!next.anio && entry.anio_desde) next.anio = entry.anio_desde;
    }
    onChange(next);
  };

  // Apply catalog metadata whenever the targeted entry loads/changes.
  useEffect(() => {
    if (value.marca && value.modelo && catalogEntry) {
      applyEntry(catalogEntry, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogEntry?.id]);

  const handleMarcaSelect = (marca: string) => {
    applyEntry(undefined, { marca, modelo: '', anio: value.anio });
    setMarcaOpen(false);
  };

  const handleModeloSelect = (modelo: string) => {
    applyEntry(undefined, { modelo });
    setModeloOpen(false);
  };

  const openAddDialog = (seed: { marca?: string; modelo?: string } = {}) => {
    setAddSeed(seed);
    setAddOpen(true);
  };

  const handleCreated = (entry: VehicleCatalog) => {
    applyEntry(entry, {
      marca: entry.marca,
      modelo: entry.modelo,
      anio: value.anio ?? entry.anio_desde ?? undefined,
    });
  };

  const currentYear = new Date().getFullYear();

  const isLoading = isLoadingMarcas || isLoadingModelos;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marca */}
        <div className="space-y-1.5">
          <Label>Marca *</Label>
          <Popover open={marcaOpen} onOpenChange={setMarcaOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                <span className={cn(!value.marca && 'text-muted-foreground')}>
                  {value.marca || (isLoadingMarcas ? 'Cargando...' : 'Seleccionar marca')}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar marca..." />
                <CommandList>
                  <CommandEmpty>Sin coincidencias</CommandEmpty>
                  <CommandGroup>
                    {marcas.map((m) => (
                      <CommandItem key={m} value={m} onSelect={() => handleMarcaSelect(m)}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            normalize(value.marca) === normalize(m) ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {m}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {allowAdd && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setMarcaOpen(false);
                            openAddDialog({});
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar nueva marca/modelo al catálogo
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Modelo */}
        <div className="space-y-1.5">
          <Label>Modelo *</Label>
          <Popover open={modeloOpen} onOpenChange={setModeloOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={!value.marca}
                className="w-full justify-between font-normal"
              >
                <span className={cn(!value.modelo && 'text-muted-foreground')}>
                  {value.modelo || (value.marca ? (isLoadingModelos ? 'Cargando...' : 'Seleccionar modelo') : 'Elige una marca primero')}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar modelo..." />
                <CommandList>
                  <CommandEmpty>Sin coincidencias</CommandEmpty>
                  <CommandGroup>
                    {modelosForMarca.map((m) => (
                      <CommandItem key={m} value={m} onSelect={() => handleModeloSelect(m)}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            normalize(value.modelo) === normalize(m) ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {m}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {allowAdd && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setModeloOpen(false);
                            openAddDialog({ marca: value.marca });
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar nuevo modelo a {value.marca}
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Año */}
        <div className="space-y-1.5">
          <Label>Año</Label>
          <Input
            type="number"
            min={1900}
            max={currentYear + 1}
            value={value.anio ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              const next = raw ? parseInt(raw, 10) : undefined;
              applyEntry(catalogEntry, { anio: next });
            }}
            placeholder={String(currentYear)}
          />
          {catalogEntry?.anio_desde && catalogEntry?.anio_hasta && (
            <p className="text-xs text-muted-foreground">
              Rango catálogo: {catalogEntry.anio_desde}–{catalogEntry.anio_hasta}
            </p>
          )}
        </div>
      </div>

      <AddCatalogEntryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialMarca={addSeed.marca}
        initialModelo={addSeed.modelo}
        onCreated={handleCreated}
      />
    </div>
  );
}
