import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateService } from "@/hooks/useServices";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().optional(),
  precio_base: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  tiempo_estimado_minutos: z.number().min(15, "El tiempo mínimo es 15 minutos"),
  requiere_checklist: z.boolean(),
  activo: z.boolean(),
  solo_cotizable_externo: z.boolean(),
  branch_id: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function NewService() {
  const navigate = useNavigate();
  const location = useLocation();
  const duplicateData = location.state?.duplicate;

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: duplicateData ? {
      nombre: `${duplicateData.nombre} (copia)`,
      descripcion: duplicateData.descripcion,
      precio_base: duplicateData.precio_base,
      tiempo_estimado_minutos: duplicateData.tiempo_estimado_minutos,
      requiere_checklist: duplicateData.requiere_checklist,
      activo: true,
      solo_cotizable_externo: duplicateData.solo_cotizable_externo
    } : {
      nombre: "",
      descripcion: "",
      precio_base: 0,
      tiempo_estimado_minutos: 60,
      requiere_checklist: false,
      activo: true,
      solo_cotizable_externo: false
    }
  });

  const createService = useCreateService();

  const onSubmit = async (data: FormValues) => {
    try {
      const service = await createService.mutateAsync(data as any);
      toast.success("Servicio creado exitosamente");
      navigate(`/services/${service.id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al crear el servicio");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={duplicateData ? "Duplicar Servicio" : "Nuevo Servicio"}
        description="Crea un nuevo servicio"
        action={
          <Button variant="ghost" onClick={() => navigate("/services")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...register("nombre")}
                placeholder="Ej: Instalación GPS PRO"
              />
              {errors.nombre && (
                <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                {...register("descripcion")}
                placeholder="Descripción del servicio"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="precio_base">Precio Base *</Label>
                <Input
                  id="precio_base"
                  type="number"
                  step="0.01"
                  {...register("precio_base", { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.precio_base && (
                  <p className="text-sm text-destructive mt-1">{errors.precio_base.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tiempo_estimado_minutos">Tiempo Estimado (minutos) *</Label>
                <Input
                  id="tiempo_estimado_minutos"
                  type="number"
                  {...register("tiempo_estimado_minutos", { valueAsNumber: true })}
                  placeholder="60"
                />
                {errors.tiempo_estimado_minutos && (
                  <p className="text-sm text-destructive mt-1">{errors.tiempo_estimado_minutos.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiere_checklist"
                checked={watch("requiere_checklist")}
                onCheckedChange={(checked) => setValue("requiere_checklist", checked)}
              />
              <Label htmlFor="requiere_checklist">Requiere checklist</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="solo_cotizable_externo"
                checked={watch("solo_cotizable_externo")}
                onCheckedChange={(checked) => setValue("solo_cotizable_externo", checked)}
              />
              <Label htmlFor="solo_cotizable_externo">Solo cotizable externamente</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={watch("activo")}
                onCheckedChange={(checked) => setValue("activo", checked)}
              />
              <Label htmlFor="activo">Activo</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Creando..." : "Crear Servicio"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/services")}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </PageContainer>
  );
}
