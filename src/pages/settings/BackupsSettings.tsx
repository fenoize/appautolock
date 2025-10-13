import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { BackupManager } from "@/components/settings/BackupManager";

export default function BackupsSettings() {
  return (
    <div>
      <SettingsHeader 
        title="Respaldos"
        description="Crea y gestiona respaldos del sistema"
      />
      <BackupManager />
    </div>
  );
}
