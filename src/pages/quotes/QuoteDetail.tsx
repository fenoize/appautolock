import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useQuote, 
  useConvertQuoteToWO, 
  useMarkQuoteInReview, 
  useSendQuoteEmail, 
  useCancelQuote, 
  useDeleteQuote,
  useDuplicateQuote,
  useAssignVehicle
} from '@/hooks/useQuotes';
import { PageContainer } from '@/components/shared/PageContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { QuoteApprovalDialog } from '@/components/quotes/QuoteApprovalDialog';
import { QuoteRejectDialog } from '@/components/quotes/QuoteRejectDialog';
import { QuoteToWODialog } from '@/components/quotes/QuoteToWODialog';
import { QuoteEmailDialog } from '@/components/quotes/QuoteEmailDialog';
import { QuoteCancelDialog } from '@/components/quotes/QuoteCancelDialog';
import { QuoteDeleteDialog } from '@/components/quotes/QuoteDeleteDialog';
import { AssignVehicleDialog } from '@/components/quotes/AssignVehicleDialog';
import { InvoiceHeader } from '@/components/quotes/InvoiceHeader';
import { InvoiceInfo } from '@/components/quotes/InvoiceInfo';
import { InvoiceItemsTable } from '@/components/quotes/InvoiceItemsTable';
import { InvoiceSummary } from '@/components/quotes/InvoiceSummary';
import {
  ArrowLeft,
  FileText,
  Mail,
  Check,
  X,
  FileCheck,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  FileDown,
  Car,
  AlertTriangle,
  Download
} from 'lucide-react';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(id!);
  
  const markInReviewMutation = useMarkQuoteInReview();
  const sendEmailMutation = useSendQuoteEmail();
  const cancelMutation = useCancelQuote();
  const deleteMutation = useDeleteQuote();
  const duplicateMutation = useDuplicateQuote();
  const assignVehicleMutation = useAssignVehicle();
  
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignVehicleDialogOpen, setAssignVehicleDialogOpen] = useState(false);

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
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Cotización no encontrada</h2>
          <p className="text-muted-foreground">
            La cotización que buscas no existe o no tienes permisos para verla.
          </p>
        </Card>
      </PageContainer>
    );
  }

  const handleAssignVehicle = (vehicleId: string) => {
    assignVehicleMutation.mutate({ quoteId: quote.id, vehicleId });
  };

  const renderActionButtons = () => {
    switch (quote.estado) {
      case 'borrador':
        return (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </>
        );
      
      case 'enviada':
        return (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => markInReviewMutation.mutate(quote.id)}>
              <FileCheck className="mr-2 h-4 w-4" />
              Marcar en Revisión
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Reenviar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setCancelDialogOpen(true)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </>
        );
      
      case 'en_revision':
        return (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button size="sm" onClick={() => setApprovalDialogOpen(true)}>
              <Check className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setRejectDialogOpen(true)}>
              <X className="mr-2 h-4 w-4" />
              Rechazar
            </Button>
          </>
        );
      
      case 'aceptada':
        return (
          <>
            {!quote.vehicle_id ? (
              <Button onClick={() => setAssignVehicleDialogOpen(true)}>
                <Car className="mr-2 h-4 w-4" />
                Asignar Vehículo
              </Button>
            ) : (
              <Button onClick={() => setConvertDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Convertir a OT
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </>
        );
      
      case 'convertida_ot':
        return (
          <>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Ver OT
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </>
        );
      
      case 'rechazada':
      case 'cancelada':
      case 'expirada':
        return (
          <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate(quote.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      {/* Breadcrumbs y Navegación */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/quotes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Cotizaciones
        </Button>
      </div>

      {/* Documento tipo Factura */}
      <Card className="p-8 max-w-5xl mx-auto">
        {/* Header con logo y datos emisor/cliente */}
        <InvoiceHeader quote={quote} />

        {/* Información clave (folio, fecha, estado, vendedor) */}
        <InvoiceInfo quote={quote} />

        {/* Alert de vehículo si está aceptada sin vehículo */}
        {quote.estado === 'aceptada' && !quote.vehicle_id && (
          <Alert className="border-warning bg-warning/10 mb-6">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              <strong>Acción requerida:</strong> Asigna un vehículo para poder convertir esta cotización en una Orden de Trabajo.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert de éxito si está aceptada con vehículo */}
        {quote.estado === 'aceptada' && quote.vehicle_id && (
          <Alert className="border-accent bg-accent/10 mb-6">
            <Check className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent-foreground">
              <strong>Lista para convertir:</strong> Esta cotización está aprobada y tiene un vehículo asignado. Puedes convertirla a OT.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla de Items */}
        {quote.items && quote.items.length > 0 && (
          <div className="mb-6">
            <InvoiceItemsTable items={quote.items} />
          </div>
        )}

        {/* Resumen Financiero */}
        <InvoiceSummary quote={quote} />

        <Separator className="my-6" />

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {renderActionButtons()}
        </div>
      </Card>

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
        quote={quote}
      />
      
      <QuoteEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onConfirm={() => sendEmailMutation.mutate(quote.id)}
        clientEmail={quote.client?.email_principal}
      />
      
      <QuoteCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={(motivo) => cancelMutation.mutate({ id: quote.id, motivo })}
      />
      
      <QuoteDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deleteMutation.mutate(quote.id)}
        quoteFolio={quote.folio}
      />

      <AssignVehicleDialog
        open={assignVehicleDialogOpen}
        onOpenChange={setAssignVehicleDialogOpen}
        clientId={quote.client_id}
        onSelectVehicle={handleAssignVehicle}
      />
    </PageContainer>
  );
}