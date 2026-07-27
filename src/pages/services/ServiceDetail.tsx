import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useServiceComplete, useUpdateService } from "@/hooks/useServices";
import { ArrowLeft, Edit, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceMaterialsEditor } from "@/components/services/ServiceMaterialsEditor";
import { ServiceCostItems } from "@/components/services/ServiceCostItems";

import { ServiceChecklistEditor } from "@/components/services/ServiceChecklistEditor";
import ServiceFichaEditor from "@/components/services/ServiceFichaEditor";
import { SubscriptionPlanSelector } from "@/components/shared/SubscriptionPlanSelector";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: service, isLoading } = useServiceComplete(id!);
  const updateService = useUpdateService();
  const { toast } = useToast();

  const [editNombre, setEditNombre] = useState("");
  const [requiereSuscripcion, setRequiereSuscripcion] = useState(false);
  const [planesSeleccionados, setPlanesSeleccionados] = useState<string[]>([]);

  const [iglaSearchBrand, setIglaSearchBrand] = useState("");
  const [iglaSearchModel, setIglaSearchModel] = useState("");
  const [iglaResults, setIglaResults] = useState<any[]>([]);
  const [iglaLoading, setIglaLoading] = useState(false);
  const [iglaSearched, setIglaSearched] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleBrandInputChange = async (value: string) => {
    setIglaSearchBrand(value);
    setIglaResults([]);
    setIglaSearched(false);
    if (value.trim().length === 0) {
      setBrandOptions([]);
      setShowBrandDropdown(false);
      return;
    }
    const { data } = await supabase
      .from("igla_compatibility")
      .select("brand")
      .ilike("brand", `${value.trim()}%`)
      .order("brand")
      .limit(50);
    const unique = [...new Set((data ?? []).map((r: any) => r.brand))].slice(0, 8) as string[];
    setBrandOptions(unique);
    setShowBrandDropdown(unique.length > 0);
  };

  const handleModelInputChange = async (value: string) => {
    setIglaSearchModel(value);
    setIglaResults([]);
    setIglaSearched(false);
    if (value.trim().length === 0) {
      setModelOptions([]);
      setShowModelDropdown(false);
      return;
    }
    let query = supabase
      .from("igla_compatibility")
      .select("model")
      .ilike("model", `${value.trim()}%`)
      .order("model")
      .limit(50);
    if (iglaSearchBrand.trim()) {
      query = (query as any).ilike("brand", iglaSearchBrand.trim());
    }
    const { data } = await query;
    const unique = [...new Set((data ?? []).map((r: any) => r.model))].slice(0, 8) as string[];
    setModelOptions(unique);
    setShowModelDropdown(unique.length > 0);
  };

  const handleIglaSearch = async () => {
    if (!iglaSearchBrand.trim() || !iglaSearchModel.trim()) return;
    setIglaLoading(true);
    setIglaSearched(false);
    try {
      const { data, error } = await supabase
        .from("igla_compatibility")
        .select("brand, model, year_from, year_to, configuration, transmission, engine_type")
        .ilike("brand", `%${iglaSearchBrand.trim()}%`)
        .ilike("model", `%${iglaSearchModel.trim()}%`)
        .eq("igla_compatible", true)
        .order("year_from", { ascending: false });
      if (!error) setIglaResults(data ?? []);
    } finally {
      setIglaLoading(false);
      setIglaSearched(true);
    }
  };

  useEffect(() => {
    if (service) {
      setEditNombre(service.nombre ?? "");
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

  const handleNombreBlur = async () => {
    const trimmed = editNombre.trim();
    if (!trimmed || trimmed === service.nombre) return;
    const { error } = await supabase
      .from("services")
      .update({ nombre: trimmed })
      .eq("id", service.id);
    if (error) {
      toast({ title: "Error al actualizar nombre", variant: "destructive" });
      setEditNombre(service.nombre);
    } else {
      toast({ title: "Nombre actualizado" });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <input
            value={editNombre}
            onChange={e => setEditNombre(e.target.value)}
            onBlur={handleNombreBlur}
            className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-ring rounded px-1 w-full"
          />
        }
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
          <TabsTrigger value="materiales">Costos</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="compatibilidad">Compatibilidad</TabsTrigger>
          <TabsTrigger value="suscripciones">Suscripciones</TabsTrigger>
          <TabsTrigger value="ficha">Ficha Comercial</TabsTrigger>
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

        <TabsContent value="materiales" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Materiales de Inventario</h3>
            <ServiceMaterialsEditor 
              serviceId={service.id} 
              materials={service.services_products || []} 
            />
          </div>

          <div className="border-t pt-6">
            <ServiceCostItems
              serviceId={service.id}
              porcentajeUtilidadInicial={(service as any).porcentaje_utilidad ?? 0}
              precioBaseActual={service.precio_base ?? 0}
            />
          </div>
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
              <CardTitle>{(service as any).usa_compatibilidad_igla ? "Compatibilidad IGLA AI200" : "Reglas de Compatibilidad"}</CardTitle>
            </CardHeader>
            <CardContent>
              {(service as any).usa_compatibilidad_igla ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Verifica si tu vehículo es compatible</h3>
                    <p className="text-sm text-muted-foreground">
                      Ingresa la marca y modelo de tu vehículo para consultar la compatibilidad con el sistema IGLA AI200.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative sm:w-48">
                      <Input
                        placeholder="Marca (ej: Toyota...)"
                        value={iglaSearchBrand}
                        onChange={(e) => handleBrandInputChange(e.target.value)}
                        onBlur={() => setTimeout(() => setShowBrandDropdown(false), 150)}
                        onFocus={() => brandOptions.length > 0 && setShowBrandDropdown(true)}
                        autoComplete="off"
                      />
                      {showBrandDropdown && (
                        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
                          {brandOptions.map((opt) => (
                            <li
                              key={opt}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                              onMouseDown={() => {
                                setIglaSearchBrand(opt);
                                setBrandOptions([]);
                                setShowBrandDropdown(false);
                              }}
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="relative flex-1">
                      <Input
                        placeholder="Modelo (ej: Hilux...)"
                        value={iglaSearchModel}
                        onChange={(e) => handleModelInputChange(e.target.value)}
                        onBlur={() => setTimeout(() => setShowModelDropdown(false), 150)}
                        onFocus={() => modelOptions.length > 0 && setShowModelDropdown(true)}
                        autoComplete="off"
                      />
                      {showModelDropdown && (
                        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
                          {modelOptions.map((opt) => (
                            <li
                              key={opt}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                              onMouseDown={() => {
                                setIglaSearchModel(opt);
                                setModelOptions([]);
                                setShowModelDropdown(false);
                              }}
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <Button
                      onClick={handleIglaSearch}
                      disabled={iglaLoading || !iglaSearchBrand.trim() || !iglaSearchModel.trim()}
                    >
                      {iglaLoading ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>

                  {iglaSearched && !iglaLoading && (
                    iglaResults.length === 0 ? (
                      <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-4 flex items-start gap-3">
                        <span className="text-yellow-500 text-xl">⚠️</span>
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Vehículo no encontrado</p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">No encontramos compatibilidad registrada para ese vehículo. Contáctanos para confirmarlo.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{iglaResults.length} variante(s) compatible(s) encontrada(s):</p>
                        {iglaResults.map((row, i) => (
                          <div key={i} className="rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                              <span className="font-semibold text-sm">{row.brand} {row.model}</span>
                              {(row.year_from || row.year_to) && (
                                <span className="text-xs text-muted-foreground">({row.year_from}–{row.year_to ?? "hoy"})</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {row.configuration && <span className="bg-white dark:bg-gray-800 rounded px-2 py-0.5 border dark:border-gray-600 dark:text-gray-300">{row.configuration}</span>}
                              {row.transmission && <span className="bg-white dark:bg-gray-800 rounded px-2 py-0.5 border dark:border-gray-600 dark:text-gray-300">{row.transmission}</span>}
                              {row.engine_type && <span className="bg-white dark:bg-gray-800 rounded px-2 py-0.5 border dark:border-gray-600 dark:text-gray-300">{row.engine_type}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              ) : service.service_compat_rules && service.service_compat_rules.length > 0 ? (
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

        <TabsContent value="ficha">
          <ServiceFichaEditor
            serviceId={service.id}
            initialFichaHtml={(service as any).ficha_html ?? ''}
            initialCategoria={(service as any).categoria ?? ''}
            initialFichaResumen={(service as any).ficha_resumen ?? ''}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
