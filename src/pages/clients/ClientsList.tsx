import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/shared/SearchBar';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { useClients } from '@/hooks/useClients';
import { ClientFilters } from '@/types/clients';

export default function ClientsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ClientFilters>({});
  
  const { data: clients, isLoading } = useClients({ ...filters, search });

  return (
    <PageContainer>
      <PageHeader
        title="Clientes"
        description="Gestiona tu cartera de clientes"
        action={
          <Button onClick={() => navigate('/clients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        }
      />

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre, RUT, email o teléfono..."
      />

      {/* Clients Grid */}
      {isLoading ? (
        <SkeletonTable rows={6} columns={3} />
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay clientes"
          description="Comienza agregando tu primer cliente a la cartera"
          action={
            <Button onClick={() => navigate('/clients/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer cliente
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(client.razon_social || client.nombre_comercial)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {client.tipo === 'empresa' 
                          ? client.razon_social 
                          : client.nombre_comercial}
                      </h3>
                      <ClientStatusBadge status={client.estado} />
                    </div>
                    {client.rut && client.dv && (
                      <p className="text-sm text-muted-foreground">
                        RUT: {client.rut}-{client.dv}
                      </p>
                    )}
                  </div>
                </div>
                
                {client.email_principal && (
                  <p className="text-sm text-muted-foreground mb-1 truncate">
                    {client.email_principal}
                  </p>
                )}
                
                {client.telefonos && client.telefonos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {client.telefonos[0]}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
