import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionFilters } from '@/types/subscriptions';
import { SubscriptionStatusBadge } from '@/components/subscriptions/SubscriptionStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionList() {
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const { data: subscriptions, isLoading } = useSubscriptions(filters);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Suscripciones GPS</h1>
          <p className="text-muted-foreground">Gestión de suscripciones de rastreo GPS</p>
        </div>
        <Link to="/subscriptions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Suscripción
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Suscripciones</CardTitle>
          <CardDescription>Todas las suscripciones del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.folio}</TableCell>
                    <TableCell>{sub.client?.razon_social || sub.client?.nombre_comercial}</TableCell>
                    <TableCell>{sub.vehicle?.patente || '-'}</TableCell>
                    <TableCell>{sub.plan?.nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(sub.fecha_vencimiento), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={sub.estado} />
                    </TableCell>
                    <TableCell>
                      <Link to={`/subscriptions/${sub.id}`}>
                        <Button variant="ghost" size="sm">Ver Detalles</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
