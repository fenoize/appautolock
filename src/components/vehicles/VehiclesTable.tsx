import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Vehicle } from '@/types/vehicles';
import { MoreVertical, Eye, Edit, KeyRound } from 'lucide-react';

interface VehiclesTableProps {
  vehicles: Vehicle[];
}

export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patente</TableHead>
            <TableHead>Marca/Modelo</TableHead>
            <TableHead className="hidden md:table-cell">Año</TableHead>
            <TableHead className="hidden lg:table-cell">Combustible</TableHead>
            <TableHead className="hidden lg:table-cell">Encendido</TableHead>
            <TableHead className="hidden lg:table-cell">Odómetro</TableHead>
            <TableHead className="hidden xl:table-cell">Propietario</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-semibold text-primary">
                {vehicle.patente}
              </TableCell>
              <TableCell>
                {vehicle.marca} {vehicle.modelo}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {vehicle.anio || '-'}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {vehicle.combustible || '-'}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {vehicle.tipo_encendido ? (
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    {vehicle.tipo_encendido}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {vehicle.odometro ? `${vehicle.odometro.toLocaleString()} km` : '-'}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {vehicle.clients?.razon_social || vehicle.clients?.nombre_comercial || '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
