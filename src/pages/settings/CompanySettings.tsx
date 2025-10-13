import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { CompanyInfoForm } from "@/components/settings/CompanyInfoForm";

export default function CompanySettings() {
  return (
    <div>
      <SettingsHeader 
        title="Información de la Empresa"
        description="Configura los datos de tu empresa y sube el logo"
      />
      <CompanyInfoForm />
    </div>
  );
}
