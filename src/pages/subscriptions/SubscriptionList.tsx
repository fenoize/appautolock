import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionFilters } from '@/types/subscriptions';
import { SubscriptionStatusBadge } from '@/components/subscriptions/SubscriptionStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const { data: subscriptions, isLoading } = useSubscriptions(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Suscripciones GPS"
        description="Gestión de suscripciones de rastreo GPS"
        action={
          <Button onClick={() => navigate('/subscriptions/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Suscripción
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Suscripciones</CardTitle>
          <CardDescription>Todas las suscripciones del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-12 text-muted-foreground">Cargando suscripciones...</p>
          ) : !subscriptions || subscriptions.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No se encontraron suscripciones</p>
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
                {subscriptions.map((sub) => (
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
    </PageContainer>
  );
}
