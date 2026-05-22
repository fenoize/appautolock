import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';
import { useBranding } from '@/hooks/useBranding';

interface BrandLogoProps {
  className?: string;
  /** Forzar mostrar logo completo aunque el sidebar esté colapsado */
  forceFull?: boolean;
}

/**
 * Logo de la empresa que se adapta:
 * - Modo claro/oscuro
 * - Versión completa vs favicon (cuando el sidebar está colapsado)
 */
export function BrandLogo({ className = '', forceFull = false }: BrandLogoProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { fullLogo, compactLogo } = useBranding();

  const collapsed = !forceFull && state === 'collapsed';
  const src = collapsed ? compactLogo || fullLogo : fullLogo;

  const handleClick = () => navigate('/dashboard');

  if (!src) {
    // Fallback minimal mark
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 ${className}`}
        aria-label="Inicio"
      >
        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">A</span>
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-foreground">Autolock</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center ${className}`}
      aria-label="Inicio"
    >
      <img
        src={src}
        alt="Logo"
        className={collapsed ? 'h-8 w-8 object-contain' : 'h-8 w-auto max-w-[160px] object-contain'}
      />
    </button>
  );
}
