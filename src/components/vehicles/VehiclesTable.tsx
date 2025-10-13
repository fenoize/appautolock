import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Vehicle } from '@/types/vehicles';
import { ChevronRight } from 'lucide-react';

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
            <TableHead className="hidden lg:table-cell">Odómetro</TableHead>
            <TableHead className="hidden xl:table-cell">Propietario</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow
              key={vehicle.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
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
                {vehicle.odometro ? `${vehicle.odometro.toLocaleString()} km` : '-'}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {vehicle.clients?.razon_social || vehicle.clients?.nombre_comercial || '-'}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
