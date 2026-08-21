import { Badge } from '@/components/ui/badge';

export type WOTipo = 'instalacion' | 'garantia' | 'mantenimiento';

const config: Record<string, { label: string; className: string }> = {
  instalacion: { label: 'Instalación', className: 'bg-primary/10 text-primary border-primary/30' },
  garantia: { label: 'Garantía', className: 'bg-orange-500/10 text-orange-700 border-orange-500/30' },
  mantenimiento: { label: 'Mantenimiento', className: 'bg-muted text-muted-foreground border-border' },
};

interface WOTipoBadgeProps {
  tipo?: string | null;
  className?: string;
}

export const WOTipoBadge = ({ tipo, className }: WOTipoBadgeProps) => {
  const cfg = config[tipo || 'instalacion'] || config.instalacion;
  return (
    <Badge variant="outline" className={`text-xs ${cfg.className} ${className || ''}`}>
      {cfg.label}
    </Badge>
  );
};
