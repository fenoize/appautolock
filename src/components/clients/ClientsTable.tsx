import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientStatusBadge } from './ClientStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Eye, Edit, Trash, Mail, Phone, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { animations } from '@/lib/animations';
import { Client } from '@/types/clients';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientsTableProps {
  clients: Client[];
}

// Helper para asignar colores consistentes a compañías
const getCompanyColor = (name: string) => {
  const colors = [
    { bg: 'bg-green-100 dark:bg-green-950', icon: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    { bg: 'bg-blue-100 dark:bg-blue-950', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    { bg: 'bg-purple-100 dark:bg-purple-950', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    { bg: 'bg-orange-100 dark:bg-orange-950', icon: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    { bg: 'bg-pink-100 dark:bg-pink-950', icon: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export function ClientsTable({ clients }: ClientsTableProps) {
  const navigate = useNavigate();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const allSelected = selectedClients.length === clients.length && clients.length > 0;
  const someSelected = selectedClients.length > 0 && selectedClients.length < clients.length;

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected || someSelected}
                onCheckedChange={(checked) => {
                  setSelectedClients(checked ? clients.map(c => c.id) : []);
                }}
              />
            </TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden lg:table-cell">Compañía/Giro</TableHead>
            <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
            <TableHead className="hidden xl:table-cell">Tags</TableHead>
            <TableHead className="text-right w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => {
            const companyName = client.tipo === 'empresa' ? client.razon_social : client.nombre_comercial;
            const companyColor = getCompanyColor(companyName || '');
            
            return (
              <TableRow
                key={client.id}
                className={cn(
                  animations.tableRow,
                  "group",
                  selectedClients.includes(client.id) && "bg-muted/50"
                )}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => {
                      setSelectedClients(prev => 
                        checked 
                          ? [...prev, client.id]
                          : prev.filter(id => id !== client.id)
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarFallback className="bg-primary-soft text-primary font-semibold">
                        {companyName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.created_at 
                          ? format(new Date(client.created_at), "d 'de' MMM, yyyy", { locale: es })
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[200px]">
                      {client.email_principal || '-'}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="hidden lg:table-cell">
                  {client.giro ? (
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-lg border",
                        companyColor.bg,
                        companyColor.border
                      )}>
                        <Building2 className={cn("h-4 w-4", companyColor.icon)} />
                      </div>
                      <span className="text-sm truncate max-w-[150px]">{client.giro}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                
                <TableCell className="hidden lg:table-cell">
                  {client.telefonos && client.telefonos[0] ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.telefonos[0]}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                
                <TableCell className="hidden xl:table-cell">
                  <div className="flex flex-wrap gap-1.5">
                    <ClientStatusBadge status={client.estado} />
                    <Badge variant="soft" className="text-xs capitalize">
                      {client.tipo}
                    </Badge>
                    {client.rut && client.dv && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {client.rut}-{client.dv}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${client.id}`);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement edit
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement delete
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
