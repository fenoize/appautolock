import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { QuotesTable } from '@/components/quotes/QuotesTable';
import { useQuotes } from '@/hooks/useQuotes';
import { QuoteStatus } from '@/types/quotes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QuotesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  
  const { data: quotes, isLoading } = useQuotes({
    search,
    estado: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const paginatedQuotes = useMemo(() => {
    if (!quotes) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return quotes.slice(startIndex, endIndex);
  }, [quotes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((quotes?.length || 0) / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <PageContainer>
      {/* Header con título y botones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Cotizaciones</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gestiona las cotizaciones enviadas a clientes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/quotes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por folio, cliente o vehículo..."
          className="flex-1 max-w-md"
        />
        
        <div className="flex items-center gap-2">
          <Select 
            value={statusFilter} 
            onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="aceptada">Aceptada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
              <SelectItem value="expirada">Expirada</SelectItem>
              <SelectItem value="convertida_ot">Convertida a OT</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          
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
      </div>

      {/* Quotes Content */}
      {isLoading ? (
        <SkeletonTable rows={10} columns={9} />
      ) : !quotes || quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay cotizaciones"
          description={search || statusFilter !== 'all' 
            ? "No se encontraron cotizaciones con los filtros aplicados" 
            : "Comienza creando tu primera cotización"}
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

      {/* Pagination */}
      {quotes && quotes.length > itemsPerPage && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, quotes.length)} de{' '}
            {quotes.length} cotizaciones
          </p>
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </PageContainer>
  );
}
