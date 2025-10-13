import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientStatusBadge } from './ClientStatusBadge';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { animations } from '@/lib/animations';
import { Client } from '@/types/clients';

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>RUT/Pasaporte</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => (
            <TableRow
              key={client.id}
              className={cn(
                animations.tableRow,
                "cursor-pointer group"
              )}
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback className="bg-primary-soft text-primary font-semibold">
                      {(client.razon_social || client.nombre_comercial)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {client.tipo === 'empresa' ? client.razon_social : client.nombre_comercial}
                    </p>
                    {client.giro && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{client.giro}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <span className="font-mono text-sm">
                  {client.rut && client.dv 
                    ? `${client.rut}-${client.dv}`
                    : client.pasaporte || '-'}
                </span>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {client.email_principal && (
                    <p className="text-sm truncate max-w-[220px]">{client.email_principal}</p>
                  )}
                  {client.telefonos && client.telefonos[0] && (
                    <p className="text-xs text-muted-foreground">{client.telefonos[0]}</p>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="soft" className="capitalize">
                  {client.tipo}
                </Badge>
              </TableCell>
              
              <TableCell>
                <ClientStatusBadge status={client.estado} />
              </TableCell>
              
              <TableCell className="text-right">
                <ChevronRight className={cn(
                  "h-4 w-4 text-muted-foreground inline",
                  "transition-transform duration-200",
                  "group-hover:translate-x-1 group-hover:text-primary"
                )} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
