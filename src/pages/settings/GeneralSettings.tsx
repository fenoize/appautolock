import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SystemPreferencesForm } from "@/components/settings/SystemPreferencesForm";

export default function GeneralSettings() {
  return (
    <div>
      <SettingsHeader 
        title="Preferencias del Sistema"
        description="Configura la moneda, IVA y zona horaria del sistema"
      />
      <SystemPreferencesForm />
    </div>
  );
}
