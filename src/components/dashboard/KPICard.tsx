import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'orange' | 'red' | 'yellow' | 'green' | 'purple';
  trend?: number;
  trendLabel?: string;
  description?: string;
  onClick?: () => void;
  urgent?: boolean;
}

const colorConfig = {
  blue:   { icon: 'text-info',        bg: 'bg-info-soft' },
  orange: { icon: 'text-primary',     bg: 'bg-primary-soft' },
  red:    { icon: 'text-destructive', bg: 'bg-destructive-soft' },
  yellow: { icon: 'text-warning',     bg: 'bg-warning-soft' },
  green:  { icon: 'text-success',     bg: 'bg-success-soft' },
  purple: { icon: 'text-purple-500',  bg: 'bg-purple-soft' },
};

export function KPICard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendLabel,
  description,
  onClick,
  urgent = false,
}: KPICardProps) {
  const c = colorConfig[color];
  return (
    <Card
      className={cn(
        'group transition-shadow duration-200 hover:shadow-md',
        onClick && 'cursor-pointer',
        urgent && 'ring-2 ring-destructive ring-offset-2 animate-pulse-once'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {trend >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className={trend >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                  {Math.abs(trend)}%
                </span>
                {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
              </div>
            )}
            {description && (
              <p className="mt-2 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
              c.bg,
              'transition-transform duration-200 group-hover:scale-105'
            )}
          >
            <Icon className={cn('h-6 w-6', c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
