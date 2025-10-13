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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {backButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
