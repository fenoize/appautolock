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
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'mx-auto space-y-6',
      'p-6',
      'animate-in fade-in-0 duration-300',
      'overflow-x-hidden',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}
