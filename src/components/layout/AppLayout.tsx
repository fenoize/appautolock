import { ReactNode } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { AppBottomNav } from './AppBottomNav';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const { state } = useSidebar();

  const mainMarginLeft = isDesktop 
    ? (state === 'collapsed' ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)')
    : '0px';

  const mainPaddingBottom = isMobile ? 'var(--bottom-nav-h)' : '0px';

  return (
    <div className="min-h-screen bg-background">
      <AppTopbar />
      
      {!isMobile && <AppSidebar />}
      
      <main 
        className="min-h-screen overflow-y-auto transition-[margin] duration-200 ease-linear"
        style={{
          paddingTop: 'var(--header-h)',
          marginLeft: mainMarginLeft,
          paddingBottom: mainPaddingBottom
        }}
      >
        <AppBreadcrumbs />
        {children}
      </main>
      
      {isMobile && <AppBottomNav />}
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
