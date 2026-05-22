import { useSettings } from './useSettings';
import { useTheme } from './useTheme';

export interface BrandingLogos {
  logoLight: string;
  logoDark: string;
  faviconLight: string;
  faviconDark: string;
  /** Logo completo según tema actual */
  fullLogo: string;
  /** Favicon / logo compacto según tema actual */
  compactLogo: string;
}

export function useBranding(): BrandingLogos {
  const { data: settings } = useSettings();
  const { theme } = useTheme();

  const get = (key: string) => settings?.find((s) => s.clave === key)?.valor || '';

  const logoLight = get('empresa_logo_url');
  const logoDark = get('empresa_logo_dark_url') || logoLight;
  const faviconLight = get('empresa_favicon_url') || logoLight;
  const faviconDark = get('empresa_favicon_dark_url') || faviconLight || logoDark;

  const isDark = theme === 'dark';
  return {
    logoLight,
    logoDark,
    faviconLight,
    faviconDark,
    fullLogo: isDark ? logoDark : logoLight,
    compactLogo: isDark ? faviconDark : faviconLight,
  };
}
