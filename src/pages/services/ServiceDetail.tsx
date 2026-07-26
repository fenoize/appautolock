import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServiceComplete, useUpdateService } from "@/hooks/useServices";
import { ArrowLeft, Edit, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceMaterialsEditor } from "@/components/services/ServiceMaterialsEditor";
import { ServiceChecklistEditor } from "@/components/services/ServiceChecklistEditor";
import { SubscriptionPlanSelector } from "@/components/shared/SubscriptionPlanSelector";
import { useState, useEffect } from "react";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: service, isLoading } = useServiceComplete(id!);
  const updateService = useUpdateService();
  
  const [requiereSuscripcion, setRequiereSuscripcion] = useState(false);
  const [planesSeleccionados, setPlanesSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    if (service) {
      setRequiereSuscripcion(service.requiere_suscripcion || false);
      setPlanesSeleccionados(
        Array.isArray(service.tipos_suscripcion_disponibles) 
          ? service.tipos_suscripcion_disponibles 
          : []
      );
    }
  }, [service]);

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    );
  }

  if (!service) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Servicio no encontrado</h2>
          <Button onClick={() => navigate("/services")} className="mt-4">
            Volver al listado
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleToggleActive = async () => {
    await updateService.mutateAsync({
      id: service.id,
      activo: !service.activo
    });
  };

  const handleUpdateSuscripcion = async (requiere: boolean, planes: string[]) => {
    await updateService.mutateAsync({
      id: service.id,
      requiere_suscripcion: requiere,
      tipos_suscripcion_disponibles: planes as any
    });
  };

  const handleToggleRequiereSuscripcion = (value: boolean) => {
    setRequiereSuscripcion(value);
    if (!value) {
      setPlanesSeleccionados([]);
      handleUpdateSuscripcion(false, []);
    } else {
      handleUpdateSuscripcion(value, planesSeleccionados);
    }
  };

  const handleSelectPlanes = (planes: string[]) => {
    setPlanesSeleccionados(planes);
    handleUpdateSuscripcion(requiereSuscripcion, planes);
  };

  return (
    <PageContainer>
      <PageHeader
        title={service.nombre}
        description={service.descripcion}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/services")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline" onClick={() => navigate("/services/new", { state: { duplicate: service } })}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
            <Button onClick={handleToggleActive}>
              {service.activo ? "Desactivar" : "Activar"}
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <Badge variant={service.activo ? "default" : "secondary"}>
          {service.activo ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="compatibilidad">Compatibilidad</TabsTrigger>
          <TabsTrigger value="suscripciones">Suscripciones</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Precio Base</p>
                  <p className="text-lg font-semibold">${service.precio_base.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                  <p className="text-lg font-semibold">{service.tiempo_estimado_minutos} minutos</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requiere Checklist</p>
                  <p className="text-lg font-semibold">{service.requiere_checklist ? "Sí" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Versión</p>
                  <p className="text-lg font-semibold">v{service.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiales">
          <ServiceMaterialsEditor 
            serviceId={service.id} 
            materials={service.services_products || []} 
          />
        </TabsContent>

        <TabsContent value="checklist">
          <ServiceChecklistEditor 
            serviceId={service.id} 
            items={service.service_checklist_items || []} 
          />
        </TabsContent>

        <TabsContent value="compatibilidad">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Compatibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              {service.service_compat_rules && service.service_compat_rules.length > 0 ? (
                <div className="space-y-2">
                  {service.service_compat_rules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{rule.combustible}</Badge>
                        {rule.anio_min && <span className="text-sm">Desde {rule.anio_min}</span>}
                        {rule.anio_max && <span className="text-sm">Hasta {rule.anio_max}</span>}
                      </div>
                      {rule.nota && <p className="text-sm text-muted-foreground">{rule.nota}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <p className="text-muted-foreground font-medium">Sin reglas de compatibilidad configuradas</p>
                  <p className="text-sm text-muted-foreground">Este servicio no tiene restricciones de compatibilidad definidas aún.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suscripciones">
          <SubscriptionPlanSelector
            requiereSuscripcion={requiereSuscripcion}
            planesSeleccionados={planesSeleccionados}
            onToggleRequiereSuscripcion={handleToggleRequiereSuscripcion}
            onSelectPlanes={handleSelectPlanes}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
