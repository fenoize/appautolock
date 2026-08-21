import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export interface ProveedorComboboxProps {
  value: string | null;
  onChange: (id: string | null, nombre: string) => void;
  placeholder?: string;
}

interface ProveedorOption {
  id: string;
  razon_social: string;
  rut: string | null;
}

export function useProveedoresActivos() {
  return useQuery({
    queryKey: ['proveedores', 'activos'],
    queryFn: async (): Promise<ProveedorOption[]> => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, razon_social, rut')
        .eq('activo', true)
        .order('razon_social');
      if (error) throw error;
      return (data ?? []) as ProveedorOption[];
    },
  });
}

export function ProveedorCombobox({ value, onChange, placeholder = 'Selecciona proveedor' }: ProveedorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const { data: proveedores } = useProveedoresActivos();

  const list = proveedores ?? [];
  const selected = list.find((p) => p.id === value);
  const term = search.trim();
  const filtered = term
    ? list.filter((p) => p.razon_social.toLowerCase().includes(term.toLowerCase()))
    : list;
  const exactMatch = list.some((p) => p.razon_social.toLowerCase() === term.toLowerCase());

  const handleCreate = async () => {
    if (!term || creating) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .insert({ razon_social: term } as any)
        .select('id, razon_social, rut')
        .single();
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      onChange(data.id, data.razon_social);
      setSearch('');
      setOpen(false);
      toast({ title: 'Proveedor creado', description: data.razon_social });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selected && 'text-muted-foreground')}>
              {selected ? selected.razon_social : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar proveedor..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filtered.length === 0 && !term && <CommandEmpty>No hay proveedores.</CommandEmpty>}
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => {
                        onChange(p.id, p.razon_social);
                        setSearch('');
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="flex-1">{p.razon_social}</span>
                      {p.rut && <span className="text-xs text-muted-foreground">{p.rut}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {term && !exactMatch && (
                <CommandGroup>
                  <CommandItem value={`__create__${term}`} onSelect={handleCreate} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" />
                    {creating ? 'Creando...' : `Crear «${term}»`}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null, '')}
          aria-label="Quitar proveedor"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default ProveedorCombobox;
