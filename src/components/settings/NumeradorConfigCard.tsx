import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useBulkUpdateSettings } from "@/hooks/useSettings";
import { Loader2 } from "lucide-react";

interface NumeradorConfigCardProps {
  title: string;
  description: string;
  prefijoKey: string;
  paddingKey: string;
  prefijo: string;
  padding: string;
}

export const NumeradorConfigCard = ({
  title,
  description,
  prefijoKey,
  paddingKey,
  prefijo: initialPrefijo,
  padding: initialPadding,
}: NumeradorConfigCardProps) => {
  const [prefijo, setPrefijo] = useState(initialPrefijo);
  const [padding, setPadding] = useState(initialPadding);
  const updateSettings = useBulkUpdateSettings();

  useEffect(() => {
    setPrefijo(initialPrefijo);
    setPadding(initialPadding);
  }, [initialPrefijo, initialPadding]);

  const handleSave = () => {
    updateSettings.mutate({
      [prefijoKey]: prefijo,
      [paddingKey]: padding,
    });
  };

  const getPreview = () => {
    const year = new Date().getFullYear();
    const num = '1'.padStart(parseInt(padding) || 4, '0');
    return `${prefijo}-${year}-${num}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`prefijo-${prefijoKey}`}>Prefijo</Label>
          <Input
            id={`prefijo-${prefijoKey}`}
            value={prefijo}
            onChange={(e) => setPrefijo(e.target.value.toUpperCase())}
            maxLength={10}
          />
        </div>

        <div>
          <Label htmlFor={`padding-${paddingKey}`}>Padding (dígitos)</Label>
          <Input
            id={`padding-${paddingKey}`}
            type="number"
            value={padding}
            onChange={(e) => setPadding(e.target.value)}
            min={1}
            max={8}
          />
        </div>

        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Vista previa:</p>
          <p className="font-mono font-bold">{getPreview()}</p>
        </div>

        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full">
          {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
};
