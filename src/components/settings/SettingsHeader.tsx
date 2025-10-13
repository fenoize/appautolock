import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  title: string;
  description?: string;
}

export const SettingsHeader = ({ title, description }: SettingsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/settings')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Configuración
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};
