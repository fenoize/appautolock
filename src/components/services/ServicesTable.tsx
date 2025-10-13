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
import { Edit, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServicesTableProps {
  services: Service[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (service: Service) => void;
}

export function ServicesTable({ services, isLoading, onDelete, onDuplicate }: ServicesTableProps) {
  const navigate = useNavigate();

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
