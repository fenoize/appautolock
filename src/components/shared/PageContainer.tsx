import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = 'full' 
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'w-full'
  };

  return (
    <div className={cn('p-4 md:p-6 space-y-6 mx-auto', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}
