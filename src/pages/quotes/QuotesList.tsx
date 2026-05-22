import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageContainer } from '@/components/shared/PageContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { QuotesTable } from '@/components/quotes/QuotesTable';
import { useQuotes } from '@/hooks/useQuotes';
import { useUsers } from '@/hooks/useUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { QuoteStatus } from '@/types/quotes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<QuoteStatus | 'all', string> = {
  all: 'Todos',
  borrador: 'Borrador',
  enviada: 'Enviada',
  en_revision: 'En revisión',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  expirada: 'Expirada',
  convertida_ot: 'Convertida a OT',
  cancelada: 'Cancelada',
};

export default function QuotesList() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [vendedorFilter, setVendedorFilter] = useState<string>('all');
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  const { data: users } = useUsers();
  const vendedores = useMemo(
    () => (users || []).filter((u) => u.roles?.includes('vendedor')),
    [users]
  );

  const { data: quotes, isLoading } = useQuotes({
    search,
    estado: statusFilter !== 'all' ? statusFilter : undefined,
    vendedor_id: vendedorFilter !== 'all' ? vendedorFilter : undefined,
    fecha_desde: fechaDesde ? format(fechaDesde, 'yyyy-MM-dd') : undefined,
    fecha_hasta: fechaHasta ? format(fechaHasta, 'yyyy-MM-dd') : undefined,
  });

  const paginatedQuotes = useMemo(() => {
    if (!quotes) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return quotes.slice(startIndex, startIndex + itemsPerPage);
  }, [quotes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((quotes?.length || 0) / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, vendedorFilter, fechaDesde, fechaHasta]);

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (search) activeFilters.push({ key: 'search', label: `Búsqueda: "${search}"`, clear: () => setSearch('') });
  if (statusFilter !== 'all')
    activeFilters.push({ key: 'estado', label: `Estado: ${STATUS_LABELS[statusFilter]}`, clear: () => setStatusFilter('all') });
  if (vendedorFilter !== 'all') {
    const v = vendedores.find((x) => x.id === vendedorFilter);
    activeFilters.push({
      key: 'vendedor',
      label: `Vendedor: ${v ? `${v.nombre} ${v.apellido ?? ''}`.trim() : ''}`,
      clear: () => setVendedorFilter('all'),
    });
  }
  if (fechaDesde)
    activeFilters.push({
      key: 'desde',
      label: `Desde: ${format(fechaDesde, 'd MMM yyyy', { locale: es })}`,
      clear: () => setFechaDesde(undefined),
    });
  if (fechaHasta)
    activeFilters.push({
      key: 'hasta',
      label: `Hasta: ${format(fechaHasta, 'd MMM yyyy', { locale: es })}`,
      clear: () => setFechaHasta(undefined),
    });

  const clearAll = () => {
    setSearch('');
    setStatusFilter('all');
    setVendedorFilter('all');
    setFechaDesde(undefined);
    setFechaHasta(undefined);
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Cotizaciones</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gestiona las cotizaciones enviadas a clientes
          </p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Búsqueda + paginación */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por folio, cliente, RUT o patente..."
          className="flex-1 max-w-xl"
        />
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(v) => {
            setItemsPerPage(parseInt(v));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 por página</SelectItem>
            <SelectItem value="30">30 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fila de filtros */}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as (QuoteStatus | 'all')[]).map((k) => (
              <SelectItem key={k} value={k}>
                {STATUS_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('justify-start text-left font-normal w-[180px]', !fechaDesde && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaDesde ? format(fechaDesde, 'd MMM yyyy', { locale: es }) : 'Desde'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaDesde}
              onSelect={setFechaDesde}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('justify-start text-left font-normal w-[180px]', !fechaHasta && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaHasta ? format(fechaHasta, 'd MMM yyyy', { locale: es }) : 'Hasta'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaHasta}
              onSelect={setFechaHasta}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        {isAdmin && (
          <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nombre} {v.apellido ?? ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Chips de filtros activos + contador */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {activeFilters.map((f) => (
          <Badge key={f.key} variant="secondary" className="gap-1 pr-1">
            {f.label}
            <button
              onClick={f.clear}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              aria-label="Quitar filtro"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs">
            Limpiar todo
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {isLoading ? 'Cargando…' : `${quotes?.length ?? 0} resultado${(quotes?.length ?? 0) === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <SkeletonTable rows={10} columns={9} />
      ) : !quotes || quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay cotizaciones"
          description={
            activeFilters.length > 0
              ? 'No se encontraron cotizaciones con los filtros aplicados'
              : 'Comienza creando tu primera cotización'
          }
          action={
            <Button onClick={() => navigate('/quotes/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera cotización
            </Button>
          }
        />
      ) : (
        <QuotesTable quotes={paginatedQuotes} />
      )}

      {quotes && quotes.length > itemsPerPage && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, quotes.length)} de {quotes.length} cotizaciones
          </p>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </PageContainer>
  );
}
