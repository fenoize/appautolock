import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { supabase } from '@/integrations/supabase/client';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { WOSubscriptionsTab } from '@/components/workOrders/WOSubscriptionsTab';
import { WODetailHeader } from '@/components/workOrders/WODetailHeader';
import { WOItemsTable } from '@/components/workOrders/WOItemsTable';
import { WONotesSection } from '@/components/workOrders/WONotesSection';
import { AssignTechnicianDialog } from '@/components/workOrders/AssignTechnicianDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  Download, 
  Play, 
  Pause, 
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  Calendar,
  FileText,
  Bell,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wo, isLoading } = useWorkOrder(id!);
  const updateWO = useUpdateWorkOrder();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [pendingGpsDialog, setPendingGpsDialog] = useState<{ open: boolean; items: string[] }>({ open: false, items: [] });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">OT no encontrada</h2>
          <p className="text-muted-foreground">
            La orden de trabajo que buscas no existe o no tienes permisos para verla.
          </p>
        </Card>
      </div>
    );
  }

  const handleChangeStatus = (newStatus: string) => {
    if (id) {
      updateWO.mutate({ id, estado: newStatus as any });
    }
  };

  const handleFinalizarOT = async () => {
    if (!id) return;
    const { data: pending } = await supabase
      .from('wo_subscription_items')
      .select('id, nombre')
      .eq('wo_id', id)
      .is('subscription_id', null);
    if (pending && pending.length > 0) {
      setPendingGpsDialog({ open: true, items: pending.map((p: any) => p.nombre) });
      return;
    }
    handleChangeStatus('completada');
  };



  const renderStatusButtons = () => {
    switch (wo.estado) {
      case 'pendiente':
        return (
          <Button onClick={() => setShowAssignDialog(true)}>
            <Wrench className="mr-2 h-4 w-4" />
            Asignar Técnico
          </Button>
        );
      case 'asignada':
        return (
          <Button onClick={() => handleChangeStatus('programada')}>
            <Calendar className="mr-2 h-4 w-4" />
            Programar
          </Button>
        );
      case 'programada':
        return (
          <Button onClick={() => handleChangeStatus('en_ruta')}>
            <MapPin className="mr-2 h-4 w-4" />
            Iniciar Ruta
          </Button>
        );
      case 'en_ruta':
        return (
          <Button onClick={() => handleChangeStatus('en_proceso')}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar Trabajo
          </Button>
        );
      case 'en_proceso':
        return (
          <>
            <Button onClick={() => handleChangeStatus('pausada')} variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pausar
            </Button>
            <Button onClick={handleFinalizarOT}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finalizar OT
            </Button>
          </>
        );
      case 'pausada':
        return (
          <Button onClick={() => handleChangeStatus('en_proceso')}>
            <Play className="mr-2 h-4 w-4" />
            Reanudar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/work-orders')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Órdenes de Trabajo
        </Button>
        {wo.estado !== 'completada' && wo.estado !== 'cancelada' && (
          <Button variant="outline" onClick={() => navigate(`/work-orders/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {/* Tarjeta de Orden de Trabajo */}
      <Card className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <WODetailHeader workOrder={wo} />

        {/* Tabs con contenido */}
        <Tabs defaultValue="items" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="items">
              Trabajo a Realizar
              {wo.items && wo.items.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                  {wo.items.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notas">Instrucciones</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="pt-4">
            <WOItemsTable items={wo.items} />
          </TabsContent>

          {/* Notas Tab */}
          <TabsContent value="notas" className="pt-4">
            <WONotesSection 
              notas={wo.notas} 
              observaciones_cierre={wo.observaciones_cierre} 
            />
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="pt-4">
            {wo.checklist_data && wo.checklist_data.items ? (
              <div className="space-y-2">
                {wo.checklist_data.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.completado ? 'bg-accent/10 border-accent' : 'bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completado}
                      disabled
                      className="h-5 w-5 mt-0.5 rounded accent-primary"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${item.completado ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.texto}
                        {item.requerido && <span className="text-destructive ml-1">*</span>}
                      </p>
                      {item.notas && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notas}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay checklist asignado a esta OT</p>
              </div>
            )}
          </TabsContent>

          {/* Evidencias Tab */}
          <TabsContent value="evidencias" className="pt-4">
            {wo.evidencias_urls && wo.evidencias_urls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wo.evidencias_urls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button variant="secondary" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Ver
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay evidencias fotográficas</p>
              </div>
            )}
          </TabsContent>

          {/* Inventario Tab */}
          <TabsContent value="inventario" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-semibold mb-2">Estado de Reserva</p>
                <Badge variant={wo.inventario_reservado ? 'default' : 'outline'}>
                  {wo.inventario_reservado ? '✅ Reservado' : '❌ No reservado'}
                </Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-semibold mb-2">Estado de Consumo</p>
                <Badge variant={wo.inventario_consumido ? 'default' : 'outline'}>
                  {wo.inventario_consumido ? '✅ Consumido' : '❌ No consumido'}
                </Badge>
              </div>
            </div>

            {wo.substitutions && wo.substitutions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Sustituciones de Productos</h3>
                <div className="space-y-2">
                  {wo.substitutions.map((sub) => (
                    <div key={sub.id} className="p-3 border rounded-lg bg-warning/10">
                      <p className="text-sm font-medium">
                        {sub.producto_original?.nombre} → {sub.producto_sustituto?.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cantidad: {sub.cantidad} • {sub.razon}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

        </Tabs>

        <Separator className="my-6" />

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {wo.pdf_informe_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={wo.pdf_informe_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Informe
                </a>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {renderStatusButtons()}
          </div>
        </div>
      </Card>

      {/* Dialog de asignación de técnico */}
      <AssignTechnicianDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        workOrderId={wo.id}
        branchId={wo.branch_id}
      />
    </div>
  );
}