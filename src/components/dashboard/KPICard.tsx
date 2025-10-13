import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'orange' | 'red' | 'yellow' | 'green' | 'purple';
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
  urgent?: boolean;
}

const colorConfig = {
  blue: {
    icon: 'text-blue-500',
    bg: 'bg-blue-soft',
    border: 'border-l-blue',
  },
  orange: {
    icon: 'text-primary',
    bg: 'bg-primary-soft',
    border: 'border-l-primary',
  },
  red: {
    icon: 'text-destructive',
    bg: 'bg-destructive-soft',
    border: 'border-l-destructive',
  },
  yellow: {
    icon: 'text-warning',
    bg: 'bg-yellow-100',
    border: 'border-l-[hsl(var(--warning))]',
  },
  green: {
    icon: 'text-accent',
    bg: 'bg-accent-soft',
    border: 'border-l-accent',
  },
  purple: {
    icon: 'text-purple-500',
    bg: 'bg-purple-soft',
    border: 'border-l-purple',
  }
};

export function KPICard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendLabel,
  onClick,
  urgent = false,
}: KPICardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden group",
        "border-l-4", colorConfig[color].border,
        "transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1",
        onClick && "cursor-pointer",
        urgent && "ring-2 ring-destructive ring-offset-2 animate-pulse-once"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "rounded-full p-2.5",
          colorConfig[color].bg,
          "transition-transform duration-200",
          "group-hover:scale-110"
        )}>
          <Icon className={cn("h-5 w-5", colorConfig[color].icon)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className={trend >= 0 ? "text-accent" : "text-destructive"}>
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
