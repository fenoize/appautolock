import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { NumeradorConfigCard } from "@/components/settings/NumeradorConfigCard";
import { useSettings } from "@/hooks/useSettings";
import { Loader2 } from "lucide-react";

export default function NumeradoresSettings() {
  const { data: settings, isLoading } = useSettings();

  const getValue = (key: string) => settings?.find(s => s.clave === key)?.valor || '';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <SettingsHeader 
        title="Numeradores"
        description="Configura los prefijos y formato de los folios"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumeradorConfigCard
          title="Cotizaciones"
          description="Formato de folios para cotizaciones"
          prefijoKey="numerador_cotizacion_prefijo"
          paddingKey="numerador_cotizacion_padding"
          prefijo={getValue('numerador_cotizacion_prefijo')}
          padding={getValue('numerador_cotizacion_padding')}
        />
        <NumeradorConfigCard
          title="Órdenes de Trabajo"
          description="Formato de folios para OTs"
          prefijoKey="numerador_ot_prefijo"
          paddingKey="numerador_ot_padding"
          prefijo={getValue('numerador_ot_prefijo')}
          padding={getValue('numerador_ot_padding')}
        />
        <NumeradorConfigCard
          title="Suscripciones"
          description="Formato de folios para suscripciones"
          prefijoKey="numerador_suscripcion_prefijo"
          paddingKey="numerador_suscripcion_padding"
          prefijo={getValue('numerador_suscripcion_prefijo')}
          padding={getValue('numerador_suscripcion_padding')}
        />
      </div>
    </div>
  );
}
