import { useParams, useNavigate } from 'react-router-dom';
import { useWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function WODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wo, isLoading } = useWorkOrder(id!);
  const updateWO = useUpdateWorkOrder();

  if (isLoading) return <div>Cargando...</div>;
  if (!wo) return <div>OT no encontrada</div>;

  const handleChangeStatus = (newStatus: string) => {
    if (id) {
      updateWO.mutate({ id, estado: newStatus as any });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{wo.folio}</h1>
            <WOStatusBadge status={wo.estado} />
          </div>
        </div>
        {wo.pdf_informe_url && (
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {wo.estado === 'pendiente' && (
          <Button onClick={() => handleChangeStatus('asignada')}>
            Asignar Técnico
          </Button>
        )}
        {wo.estado === 'asignada' && (
          <Button onClick={() => handleChangeStatus('programada')}>
            Programar
          </Button>
        )}
        {wo.estado === 'programada' && (
          <Button onClick={() => handleChangeStatus('en_ruta')}>
            Iniciar Ruta
          </Button>
        )}
        {wo.estado === 'en_ruta' && (
          <Button onClick={() => handleChangeStatus('en_proceso')}>
            Iniciar Trabajo
          </Button>
        )}
        {wo.estado === 'en_proceso' && (
          <>
            <Button onClick={() => handleChangeStatus('pausada')} variant="outline">
              Pausar
            </Button>
            <Button onClick={() => handleChangeStatus('completada')}>
              Finalizar OT
            </Button>
          </>
        )}
        {wo.estado === 'pausada' && (
          <Button onClick={() => handleChangeStatus('en_proceso')}>
            Reanudar
          </Button>
        )}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información General</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Cliente</h3>
                <p>{wo.client?.razon_social || wo.client?.nombre_comercial}</p>
              </div>
              {wo.vehicle && (
                <div>
                  <h3 className="font-semibold">Vehículo</h3>
                  <p>{wo.vehicle.marca} {wo.vehicle.modelo} - {wo.vehicle.patente}</p>
                </div>
              )}
              {wo.tecnico && (
                <div>
                  <h3 className="font-semibold">Técnico</h3>
                  <p>{wo.tecnico.nombre} {wo.tecnico.apellido}</p>
                </div>
              )}
              {wo.fecha_programada && (
                <div>
                  <h3 className="font-semibold">Fecha Programada</h3>
                  <p>{format(new Date(wo.fecha_programada), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              )}
              {wo.notas && (
                <div>
                  <h3 className="font-semibold">Notas</h3>
                  <p className="text-sm text-muted-foreground">{wo.notas}</p>
                </div>
              )}
              {wo.duracion_minutos && (
                <div>
                  <h3 className="font-semibold">Duración</h3>
                  <p>{wo.duracion_minutos} minutos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Items de la OT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {wo.items?.map((item) => (
                  <div key={item.id} className="flex justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.item_tipo} - Cantidad: {item.cantidad}
                      </p>
                    </div>
                    {item.precio_unitario && (
                      <p className="font-semibold">${item.precio_unitario}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {wo.checklist_data ? (
                <div className="space-y-2">
                  {wo.checklist_data.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completado}
                        disabled
                        className="h-4 w-4"
                      />
                      <span>{item.texto}</span>
                      {item.requerido && <span className="text-red-500">*</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay checklist asignado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidencias">
          <Card>
            <CardHeader>
              <CardTitle>Evidencias Fotográficas</CardTitle>
            </CardHeader>
            <CardContent>
              {wo.evidencias_urls && wo.evidencias_urls.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {wo.evidencias_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-48 object-cover rounded"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay evidencias</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">Estado de Reserva:</p>
                <p>{wo.inventario_reservado ? '✅ Reservado' : '❌ No reservado'}</p>
              </div>
              <div>
                <p className="font-semibold">Estado de Consumo:</p>
                <p>{wo.inventario_consumido ? '✅ Consumido' : '❌ No consumido'}</p>
              </div>
              {wo.substitutions && wo.substitutions.length > 0 && (
                <div>
                  <p className="font-semibold">Sustituciones:</p>
                  {wo.substitutions.map((sub) => (
                    <div key={sub.id} className="p-3 border rounded mt-2">
                      <p className="text-sm">
                        {sub.producto_original?.nombre} → {sub.producto_sustituto?.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {sub.cantidad} | Razón: {sub.razon}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
