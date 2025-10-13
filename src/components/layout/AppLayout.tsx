import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { AppBottomNav } from './AppBottomNav';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile } = useResponsiveLayout();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <AppTopbar />
        <div className="flex flex-1 overflow-hidden">
          {!isMobile && <AppSidebar />}
          <main className="flex-1 overflow-y-auto">
            <AppBreadcrumbs />
            {children}
          </main>
        </div>
        {isMobile && <AppBottomNav />}
      </div>
    </SidebarProvider>
  );
}
