import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuote, useConvertQuoteToWO, useMarkQuoteInReview } from '@/hooks/useQuotes';
import { PageContainer } from '@/components/shared/PageContainer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { QuoteApprovalDialog } from '@/components/quotes/QuoteApprovalDialog';
import { QuoteRejectDialog } from '@/components/quotes/QuoteRejectDialog';
import { QuoteToWODialog } from '@/components/quotes/QuoteToWODialog';
import {
  ArrowLeft,
  FileText,
  Mail,
  Check,
  X,
  FileCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(id!);
  const markInReviewMutation = useMarkQuoteInReview();
  
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!quote) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Cotización no encontrada</CardTitle>
            <CardDescription>
              La cotización que buscas no existe o no tienes permisos para verla.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    );
  }

  const canConvertToWO = quote.estado === 'aceptada';
  const canApproveManually = quote.estado === 'en_revision';
  const canMarkInReview = quote.estado === 'enviada';

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/quotes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Cotizaciones
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{quote.folio}</h1>
            <div className="flex items-center gap-3">
              <QuoteStatusBadge status={quote.estado} />
              {quote.metodo_aprobacion && (
                <Badge variant="outline">
                  Aprobada: {quote.metodo_aprobacion === 'email' ? 'Por Email' : 'Manual'}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canMarkInReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markInReviewMutation.mutate(quote.id)}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Marcar en Revisión
              </Button>
            )}
            
            {canApproveManually && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setApprovalDialogOpen(true)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
              </>
            )}

            {canConvertToWO && quote.vehicle_id && (
              <Button
                onClick={() => setConvertDialogOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Convertir a OT
              </Button>
            )}

            {canConvertToWO && !quote.vehicle_id && (
              <Button variant="outline" disabled>
                <AlertCircle className="mr-2 h-4 w-4" />
                Asignar Vehículo Primero
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="items">Items ({quote.items?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Razón Social</p>
                  <p className="text-sm text-muted-foreground">
                    {quote.client?.razon_social || quote.client?.nombre_comercial || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">RUT</p>
                  <p className="text-sm text-muted-foreground">
                    {quote.client?.rut ? `${quote.client.rut}-${quote.client.dv}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {quote.client?.email_principal || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vehículo */}
            <Card>
              <CardHeader>
                <CardTitle>Vehículo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quote.vehicle ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">Patente</p>
                      <p className="text-sm text-muted-foreground">{quote.vehicle.patente}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Marca/Modelo</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.vehicle.marca} {quote.vehicle.modelo}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Año</p>
                      <p className="text-sm text-muted-foreground">{quote.vehicle.anio || '-'}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Sin vehículo asignado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Detalles */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Cotización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Vendedor</p>
                  <p className="text-sm text-muted-foreground">
                    {quote.vendedor?.nombre} {quote.vendedor?.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sucursal</p>
                  <p className="text-sm text-muted-foreground">
                    {quote.branch?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Fecha de Emisión</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(quote.fecha_emision), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Validez</p>
                  <p className="text-sm text-muted-foreground">{quote.validez_dias} días</p>
                </div>
              </CardContent>
            </Card>

            {/* Resumen Financiero */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Neto:</span>
                  <span className="text-sm">${quote.neto?.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">IVA (19%):</span>
                  <span className="text-sm">${quote.iva?.toLocaleString('es-CL')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    ${quote.total?.toLocaleString('es-CL')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          {quote.notas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quote.notas}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Items de la Cotización</CardTitle>
              <CardDescription>
                Lista de productos y servicios incluidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quote.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.item_tipo === 'producto' ? 'default' : 'secondary'}>
                          {item.item_tipo === 'producto' ? 'Producto' : 'Servicio'}
                        </Badge>
                        <h4 className="font-medium">{item.nombre}</h4>
                      </div>
                      {item.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">{item.descripcion}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Cantidad: {item.cantidad}</span>
                        <span>Precio Unit.: ${item.precio_unitario.toLocaleString('es-CL')}</span>
                        {item.descuento_porcentaje > 0 && (
                          <span>Desc.: {item.descuento_porcentaje}%</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.subtotal.toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <QuoteApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        quoteId={quote.id}
      />
      <QuoteRejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        quoteId={quote.id}
      />
      <QuoteToWODialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        quoteId={quote.id}
      />
    </PageContainer>
  );
}
