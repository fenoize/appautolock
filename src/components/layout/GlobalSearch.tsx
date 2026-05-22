import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, Users, Car, Wrench, Package, UserCog, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useSearchData(term: string) {
  return useQuery({
    queryKey: ['global-search', term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term}%`;
      const [clients, vehicles, services, products, technicians] = await Promise.all([
        supabase
          .from('clients')
          .select('id, razon_social, rut')
          .or(`razon_social.ilike.${like},rut.ilike.${like}`)
          .limit(5),
        supabase
          .from('vehicles')
          .select('id, patente, marca, modelo')
          .or(`patente.ilike.${like},marca.ilike.${like},modelo.ilike.${like}`)
          .limit(5),
        supabase
          .from('services')
          .select('id, nombre, descripcion')
          .ilike('nombre', like)
          .limit(5),
        supabase
          .from('products')
          .select('id, nombre, sku')
          .or(`nombre.ilike.${like},sku.ilike.${like}`)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, nombre, apellido, email')
          .or(`nombre.ilike.${like},apellido.ilike.${like},email.ilike.${like}`)
          .limit(5),
      ]);
      return {
        clients: clients.data ?? [],
        vehicles: vehicles.data ?? [],
        services: services.data ?? [],
        products: products.data ?? [],
        technicians: technicians.data ?? [],
      };
    },
  });
}

interface GlobalSearchProps {
  trigger?: 'button' | 'input';
}

export function GlobalSearch({ trigger = 'input' }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const { data, isFetching } = useSearchData(term);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setTerm('');
    navigate(path);
  };

  return (
    <>
      {trigger === 'input' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 h-9 px-3 w-[260px] rounded-full bg-muted/60 hover:bg-muted text-sm text-muted-foreground border border-transparent hover:border-border transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="hidden lg:inline-flex h-5 px-1.5 items-center gap-1 rounded border border-border bg-card text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Buscar (⌘K)"
        >
          <Search className="h-[18px] w-[18px]" />
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, vehículos, servicios, productos, técnicos..."
          value={term}
          onValueChange={setTerm}
        />
        <CommandList>
          {term.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}
          {term.length >= 2 && !isFetching && (
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          )}

          {!!data?.clients.length && (
            <CommandGroup heading="Clientes">
              {data.clients.map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/clients/${c.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{c.razon_social}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.rut}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!!data?.vehicles.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Vehículos">
                {data.vehicles.map((v) => (
                  <CommandItem key={v.id} onSelect={() => go(`/vehicles/${v.id}`)}>
                    <Car className="mr-2 h-4 w-4" />
                    <span>{v.patente}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.marca} {v.modelo}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!!data?.services.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Servicios">
                {data.services.map((s) => (
                  <CommandItem key={s.id} onSelect={() => go(`/services`)}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>{s.nombre}</span>
                    {s.descripcion && (
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">
                        {s.descripcion}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!!data?.products.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Productos">
                {data.products.map((p) => (
                  <CommandItem key={p.id} onSelect={() => go(`/inventory`)}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>{p.nombre}</span>
                    {p.sku && (
                      <span className="ml-auto text-xs text-muted-foreground">{p.sku}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!!data?.technicians.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Técnicos / Usuarios">
                {data.technicians.map((t) => (
                  <CommandItem key={t.id} onSelect={() => go(`/admin/users`)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>
                      {t.nombre} {t.apellido}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{t.email}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
