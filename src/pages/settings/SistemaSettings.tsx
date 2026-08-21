import { useState } from 'react';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const APP_VERSION = '1.5.0';
const BUILD_DATE = '2026-08-21';

const CHANGELOG: { version: string; fecha: string; tipo: 'feature' | 'fix' | 'mejora'; cambios: string[] }[] = [
  {
    version: '1.5.0',
    fecha: '2026-08-21',
    tipo: 'feature',
    cambios: [
      'Firma digital del cliente en flujo mobile de OT',
      'Módulo de inventario por ubicación (bodegas + camionetas)',
      'Recepción de compra masiva con seriales en bloque',
      'Asignación masiva de equipos a técnico con checkboxes',
      'Tab "Números de Serie" y "Stock por Ubicación" en detalle de producto',
      'Tab "Bodegas" y filtro por estado en inventario de técnico',
    ],
  },
  {
    version: '1.4.0',
    fecha: '2026-08-18',
    tipo: 'feature',
    cambios: [
      'Flujo mobile de OT: 7 pasos (Info → Checklist → Revisión → Equipos → Confirmación → Firma → Cierre)',
      'Configuración de suscripción GPS desde paso Cierre',
      'OT de Garantía con serial defectuoso',
      'Badge de tipo de OT (Instalación / Garantía / Mantenimiento)',
      'Tab "Dispositivos Instalados" en detalle de vehículo',
    ],
  },
  {
    version: '1.3.0',
    fecha: '2026-08-10',
    tipo: 'feature',
    cambios: [
      'Módulo de suscripciones GPS rediseñado',
      'Notificaciones automáticas por email (recordatorios GPS)',
      'Página pública de renovación de suscripción',
      'Templates HTML para correos de notificación',
    ],
  },
  {
    version: '1.2.0',
    fecha: '2026-07-28',
    tipo: 'mejora',
    cambios: [
      'Wizard comercial de compatibilidad y cotización',
      'Ficha comercial de servicios con editor HTML',
      'Buscador de compatibilidad IGLA integrado',
      'Categorías de servicios',
    ],
  },
  {
    version: '1.1.0',
    fecha: '2026-07-15',
    tipo: 'mejora',
    cambios: [
      'Dashboard con KPIs financieros y gráfico de ingresos',
      'Campana de notificaciones funcional',
      'Filtros y buscador en lista de OTs',
      'Inventario por técnico con asignación/devolución',
    ],
  },
];

const tipoBadge = {
  feature: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  fix: 'bg-red-500/10 text-red-700 border-red-500/30',
  mejora: 'bg-green-500/10 text-green-700 border-green-500/30',
};

const tipoLabel = { feature: 'Nueva función', fix: 'Corrección', mejora: 'Mejora' };

export default function SistemaSettings() {
  const [actualizando, setActualizando] = useState(false);

  const handleActualizar = () => {
    setActualizando(true);
    toast.info('Buscando actualizaciones...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleForzarActualizacion = async () => {
    setActualizando(true);
    toast.info('Limpiando caché y actualizando...');
    try {
      // Limpiar todos los cachés del browser
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      // Desregistrar service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (e) {
      // silencioso
    }
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
    }, 600);
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Sistema"
        description="Versión de la aplicación, actualizaciones y registro de cambios"
      />

      {/* Versión y acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Versión actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-bold font-mono">v{APP_VERSION}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5" />
                Publicada el {BUILD_DATE}
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 border-green-500/30 ml-auto" variant="outline">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Al día
            </Badge>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleActualizar}
              disabled={actualizando}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${actualizando ? 'animate-spin' : ''}`} />
              Actualizar app
            </Button>
            <Button
              variant="destructive"
              onClick={handleForzarActualizacion}
              disabled={actualizando}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Forzar actualización
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Actualizar app</strong> recarga la página normalmente. <strong>Forzar actualización</strong> borra el caché del navegador y los service workers — úsalo si ves versiones antiguas.
          </p>
        </CardContent>
      </Card>

      {/* Changelog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de actualizaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {CHANGELOG.map((entry, i) => (
            <div key={entry.version} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                {i < CHANGELOG.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="pb-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold font-mono text-sm">v{entry.version}</span>
                  <Badge variant="outline" className={tipoBadge[entry.tipo]}>
                    {tipoLabel[entry.tipo]}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{entry.fecha}</span>
                </div>
                <ul className="space-y-1">
                  {entry.cambios.map((c, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary mt-1 shrink-0">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
