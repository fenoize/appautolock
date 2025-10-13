import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Eye, Edit, FileText, Mail, Trash, FileCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { animations } from '@/lib/animations';
import { Quote } from '@/types/quotes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuotesTableProps {
  quotes: Quote[];
}

// Helper para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function QuotesTable({ quotes }: QuotesTableProps) {
  const navigate = useNavigate();
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  const allSelected = selectedQuotes.length === quotes.length && quotes.length > 0;
  const someSelected = selectedQuotes.length > 0 && selectedQuotes.length < quotes.length;

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected || someSelected}
                onCheckedChange={(checked) => {
                  setSelectedQuotes(checked ? quotes.map(q => q.id) : []);
                }}
              />
            </TableHead>
            <TableHead>Folio / Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden lg:table-cell">Vehículo</TableHead>
            <TableHead className="text-right">Neto</TableHead>
            <TableHead className="text-right hidden md:table-cell">IVA</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="hidden xl:table-cell">Estado</TableHead>
            <TableHead className="text-right w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote, index) => {
            return (
              <TableRow
                key={quote.id}
                className={cn(
                  animations.tableRow,
                  "group cursor-pointer",
                  selectedQuotes.includes(quote.id) && "bg-muted/50"
                )}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                onClick={() => navigate(`/quotes/${quote.id}`)}
              >
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedQuotes.includes(quote.id)}
                    onCheckedChange={(checked) => {
                      setSelectedQuotes(prev => 
                        checked 
                          ? [...prev, quote.id]
                          : prev.filter(id => id !== quote.id)
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                
                <TableCell>
                  <div>
                    <p className="font-semibold text-sm font-mono">
                      {quote.folio}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(quote.fecha_emision), "d 'de' MMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="max-w-[200px]">
                    <p className="font-medium text-sm truncate">
                      {quote.client?.razon_social || quote.client?.nombre_comercial || '-'}
                    </p>
                    {quote.client?.rut && quote.client?.dv && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {quote.client.rut}-{quote.client.dv}
                      </p>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="hidden lg:table-cell">
                  {quote.vehicle ? (
                    <div className="max-w-[180px]">
                      <p className="text-sm font-medium truncate">
                        {quote.vehicle.marca} {quote.vehicle.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {quote.vehicle.patente}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Sin vehículo
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <span className="text-sm font-medium">
                    {formatCurrency(quote.neto)}
                  </span>
                </TableCell>
                
                <TableCell className="text-right hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(quote.iva)}
                  </span>
                </TableCell>
                
                <TableCell className="text-right">
                  <span className="text-sm font-semibold">
                    {formatCurrency(quote.total)}
                  </span>
                </TableCell>
                
                <TableCell className="hidden xl:table-cell">
                  <QuoteStatusBadge status={quote.estado} />
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
                        navigate(`/quotes/${quote.id}`);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      
                      {quote.estado === 'borrador' && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement edit
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {quote.pdf_url && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          window.open(quote.pdf_url, '_blank');
                        }}>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver PDF
                        </DropdownMenuItem>
                      )}
                      
                      {(quote.estado === 'enviada' || quote.estado === 'borrador') && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement send email
                        }}>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Email
                        </DropdownMenuItem>
                      )}
                      
                      {quote.estado === 'aceptada' && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement convert to WO
                        }}>
                          <FileCheck className="mr-2 h-4 w-4" />
                          Convertir a OT
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {quote.estado === 'borrador' && (
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
                      )}
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
