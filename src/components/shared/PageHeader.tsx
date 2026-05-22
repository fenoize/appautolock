import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backButton?: boolean;
  backTo?: string;
}

export function PageHeader({ title, description, action, backButton, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {backButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] md:text-[24px] font-bold text-foreground tracking-tight leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
