import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tu cartera de clientes
            </p>
          </div>
          <Button onClick={() => navigate('/clients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, RUT, email o teléfono..."
          />
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando clientes...
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No se encontraron clientes</p>
            <Button onClick={() => navigate('/clients/new')}>
              Crear primer cliente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        {client.tipo === 'empresa' 
                          ? client.razon_social 
                          : client.nombre_comercial}
                      </h3>
                      {client.rut && client.dv && (
                        <p className="text-sm text-muted-foreground">
                          RUT: {client.rut}-{client.dv}
                        </p>
                      )}
                    </div>
                    <ClientStatusBadge status={client.estado} />
                  </div>
                  
                  {client.email_principal && (
                    <p className="text-sm text-muted-foreground mb-1">
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
      </div>
    </div>
  );
}
