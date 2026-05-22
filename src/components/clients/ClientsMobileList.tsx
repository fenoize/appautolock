import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Edit, Trash } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientStatusBadge } from './ClientStatusBadge';
import { DeleteClientDialog } from './DeleteClientDialog';
import { Client } from '@/types/clients';

interface Props {
  clients: Client[];
}

export function ClientsMobileList({ clients }: Props) {
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
      {clients.map((client) => {
        const name =
          client.tipo === 'empresa' ? client.razon_social : client.nombre_comercial;
        const rut = client.rut && client.dv ? `${client.rut}-${client.dv}` : null;
        const tel = client.telefonos?.[0];
        const subtitle = [rut, tel].filter(Boolean).join(' · ') || '-';

        return (
          <div
            key={client.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/clients/${client.id}`)}
            className="flex items-center gap-3 px-3 py-3 active:bg-muted/40 transition-colors"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary-soft text-primary font-semibold">
                {name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-foreground truncate"
                style={{ fontSize: 14 }}
              >
                {name || 'Sin nombre'}
              </p>
              <p
                className="text-muted-foreground truncate"
                style={{ fontSize: 12 }}
              >
                {subtitle}
              </p>
            </div>

            <div
              className="flex flex-col items-end gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ClientStatusBadge status={client.estado} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setToDelete(client);
                      setOpen(true);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}

      <DeleteClientDialog client={toDelete} open={open} onOpenChange={setOpen} />
    </div>
  );
}
