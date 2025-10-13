import { useState, useEffect } from 'react';

export type LayoutMode = 'desktop' | 'tablet' | 'mobile';

export function useResponsiveLayout() {
  const [mode, setMode] = useState<LayoutMode>('desktop');

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        setMode('desktop');
      } else if (width >= 768) {
        setMode('tablet');
      } else {
        setMode('mobile');
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return {
    mode,
    isDesktop: mode === 'desktop',
    isTablet: mode === 'tablet',
    isMobile: mode === 'mobile'
  };
}
