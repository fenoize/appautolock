import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  color?: 'blue' | 'orange' | 'red' | 'yellow' | 'green';
  urgent?: boolean;
  onClick?: () => void;
}

const colorMap = {
  blue: 'text-blue-500',
  orange: 'text-primary',
  red: 'text-destructive',
  yellow: 'text-warning',
  green: 'text-accent'
};

export function KPICard({ 
  title, 
  value, 
  trend, 
  trendLabel, 
  icon: Icon, 
  color = 'blue',
  urgent,
  onClick 
}: KPICardProps) {
  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow",
        onClick && "cursor-pointer",
        urgent && "border-destructive"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", colorMap[color])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={cn(
            "text-xs flex items-center mt-1",
            trend >= 0 ? "text-accent" : "text-destructive"
          )}>
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend)}% {trendLabel || 'vs período anterior'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
