import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Edit, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Vehicle } from '@/types/vehicles';

interface Props {
  vehicles: Vehicle[];
}

export function VehiclesMobileList({ vehicles }: Props) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
      {vehicles.map((v) => {
        const title = `${v.marca || ''} ${v.modelo || ''}`.trim() || 'Sin modelo';
        const subtitle = [v.anio, v.patente, v.tipo_encendido]
          .filter(Boolean)
          .join(' · ');

        return (
          <div
            key={v.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/vehicles/${v.id}`)}
            className="flex items-center gap-3 px-3 py-3 active:bg-muted/40 transition-colors"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary-soft flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-foreground truncate"
                style={{ fontSize: 14 }}
              >
                {title}
              </p>
              <p
                className="text-muted-foreground truncate"
                style={{ fontSize: 12 }}
              >
                {subtitle || '-'}
              </p>
            </div>

            <div
              className="flex flex-col items-end gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {v.combustible && (
                <Badge variant="secondary" className="text-[11px]">
                  {v.combustible}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/vehicles/${v.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/vehicles/${v.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
