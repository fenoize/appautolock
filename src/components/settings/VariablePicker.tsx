import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Copy } from "lucide-react";
import { useNotificationVariables } from "@/hooks/useNotificationVariables";
import { toast } from "sonner";

interface VariablePickerProps {
  onInsert: (variable: string) => void;
}

export const VariablePicker = ({ onInsert }: VariablePickerProps) => {
  const { data: variables, isLoading } = useNotificationVariables();
  const [search, setSearch] = useState("");

  const filteredVariables = variables?.filter(v =>
    v.variable.toLowerCase().includes(search.toLowerCase()) ||
    v.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByCategory = filteredVariables?.reduce((acc, variable) => {
    if (!acc[variable.categoria]) {
      acc[variable.categoria] = [];
    }
    acc[variable.categoria].push(variable);
    return acc;
  }, {} as Record<string, typeof variables>);

  const categoryLabels: Record<string, string> = {
    client: 'Cliente',
    vehicle: 'Vehículo',
    quote: 'Cotización',
    work_order: 'Orden de Trabajo',
    subscription: 'Suscripción',
    system: 'Sistema'
  };

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success('Variable copiada al portapapeles');
  };

  if (isLoading) {
    return <div className="p-4">Cargando variables...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {Object.entries(groupedByCategory || {}).map(([categoria, vars]) => (
            <div key={categoria}>
              <h4 className="text-sm font-semibold mb-2 text-foreground">
                {categoryLabels[categoria] || categoria}
              </h4>
              <div className="space-y-1">
                {vars.map(variable => (
                  <div
                    key={variable.id}
                    className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary">
                          {`{{${variable.variable}}}`}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {variable.tipo_dato}
                        </Badge>
                      </div>
                      {variable.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {variable.descripcion}
                        </p>
                      )}
                      {variable.ejemplo && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Ej: {variable.ejemplo}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(variable.variable)}
                        title="Copiar variable"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onInsert(`{{${variable.variable}}}`)}
                        title="Insertar variable"
                      >
                        Insertar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
