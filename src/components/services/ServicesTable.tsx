import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Service } from "@/types/services";
import { Edit, Trash2, Copy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServicesTableProps {
  services: Service[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (service: Service) => void;
}

export function ServicesTable({ services, isLoading, onDelete, onDuplicate }: ServicesTableProps) {
  const navigate = useNavigate();
  const [staleServiceIds, setStaleServiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("services_products")
        .select("service_id, precio_costo_snapshot, products(precio_costo)")
        .not("precio_costo_snapshot", "is", null);
      if (!active || !data) return;
      setStaleServiceIds(
        new Set(
          (data as any[])
            .filter((m) => Number(m.precio_costo_snapshot) !== Number(m.products?.precio_costo ?? 0))
            .map((m) => m.service_id as string),
        ),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-8">Cargando...</div>;
  }


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Tiempo (min)</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow
            key={service.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/services/${service.id}`)}
          >
            <TableCell>
              <div>
                <div className="font-medium">{service.nombre}</div>
                {service.descripcion && (
                  <div className="text-sm text-muted-foreground truncate max-w-md">
                    {service.descripcion}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>${service.precio_base.toLocaleString('es-CL')}</TableCell>
            <TableCell>{service.tiempo_estimado_minutos}</TableCell>
            <TableCell>
              <Badge variant={service.activo ? "default" : "secondary"}>
                {service.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/services/${service.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDuplicate(service)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
