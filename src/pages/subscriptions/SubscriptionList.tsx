import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { SubscriptionFilters, SubscriptionStatus } from '@/types/subscriptions';
import { SubscriptionStatusBadge } from '@/components/subscriptions/SubscriptionStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, CalendarDays, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionList() {
  const navigate = useNavigate();

  const [estado, setEstado] = useState<string>('todos');
  const [planId, setPlanId] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filters: SubscriptionFilters = useMemo(() => ({
    ...(estado !== 'todos' ? { estado: estado as SubscriptionStatus } : {}),
    ...(planId !== 'todos' ? { plan_id: planId } : {}),
  }), [estado, planId]);

  const { data: subscriptions, isLoading } = useSubscriptions(filters);
  const { data: plans } = useSubscriptionPlans(false);

  const clearFilters = () => {
    setEstado('todos');
    setPlanId('todos');
    setSearch('');
    setDesde('');
    setHasta('');
    setShowArchived(false);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (subscriptions || []).filter((sub) => {
      if (!showArchived && sub.estado === 'archivada') return false;
      if (term) {
        const haystack = [
          sub.folio,
          sub.client?.razon_social,
          sub.client?.nombre_comercial,
          sub.vehicle?.patente,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const venc = sub.fecha_vencimiento?.slice(0, 10);
      if (desde && (!venc || venc < desde)) return false;
      if (hasta && (!venc || venc > hasta)) return false;
      return true;
    });
  }, [subscriptions, search, desde, hasta]);

  const clientName = (sub: any) => sub.client?.razon_social || sub.client?.nombre_comercial || '-';

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
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="sub-search">Buscar</Label>
              <Input
                id="sub-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Folio, cliente o patente"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="suspendida">Suspendida</SelectItem>
                  <SelectItem value="mora">En Mora</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-desde">Vence desde</Label>
              <Input id="sub-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-hasta">Vence hasta</Label>
              <Input id="sub-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>

          {isLoading ? (
            <p className="text-center py-12 text-muted-foreground">Cargando suscripciones...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No se encontraron suscripciones</p>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block">
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
                    {filtered.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.folio}</TableCell>
                        <TableCell>{clientName(sub)}</TableCell>
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
                            <Button variant="ghost" size="sm" title="Ver detalles">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="space-y-3 sm:hidden">
                {filtered.map((sub) => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold truncate">{sub.folio}</p>
                          <p className="text-sm text-muted-foreground truncate">{clientName(sub)}</p>
                        </div>
                        <Link to={`/subscriptions/${sub.id}`}>
                          <Button variant="ghost" size="sm" title="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(sub.vehicle?.patente || 'Sin patente')} · {sub.plan?.nombre || 'Sin plan'}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(sub.fecha_vencimiento), 'dd/MM/yyyy')}
                        </div>
                        <SubscriptionStatusBadge status={sub.estado} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
