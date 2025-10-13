import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      "animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
    )}>
      <div className={cn(
        "rounded-full bg-muted p-6 mb-4",
        "animate-in zoom-in-75 duration-300 delay-100"
      )}>
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className={cn(
        "text-lg font-semibold mb-2",
        "animate-in fade-in-0 duration-300 delay-200"
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-sm text-muted-foreground mb-6 max-w-md",
        "animate-in fade-in-0 duration-300 delay-300"
      )}>
        {description}
      </p>
      {action && (
        <div className="animate-in fade-in-0 duration-300 delay-400">
          {action}
        </div>
      )}
    </div>
  );
}
