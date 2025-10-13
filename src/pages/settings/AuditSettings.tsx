import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { AuditLogTable } from "@/components/settings/AuditLogTable";

export default function AuditSettings() {
  return (
    <div>
      <SettingsHeader 
        title="Bitácora de Auditoría"
        description="Revisa todos los cambios realizados en el sistema"
      />
      <AuditLogTable />
    </div>
  );
}
