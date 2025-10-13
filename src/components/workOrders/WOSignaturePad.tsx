import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface WOSignaturePadProps {
  onSave: (signature: string, nombre: string) => void;
  savedSignature?: string;
  savedNombre?: string;
}

export const WOSignaturePad = ({ onSave, savedSignature, savedNombre }: WOSignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [nombre, setNombre] = useState(savedNombre || '');
  const [isSaved, setIsSaved] = useState(!!savedSignature);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsSaved(false);
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor firma antes de guardar');
      return;
    }
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre de quien firma');
      return;
    }
    const dataUrl = sigCanvas.current?.toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl, nombre);
      setIsSaved(true);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="firma-nombre">Nombre de quien firma</Label>
        <Input
          id="firma-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          disabled={isSaved}
        />
      </div>

      {isSaved && savedSignature ? (
        <Card className="p-4">
          <img src={savedSignature} alt="Firma guardada" className="w-full h-48 object-contain" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Firmado por: {savedNombre}
          </p>
        </Card>
      ) : (
        <>
          <div className="border border-border rounded-md">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-48 cursor-crosshair',
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={clear} variant="outline" size="sm">
              Limpiar
            </Button>
            <Button onClick={save} size="sm">
              Guardar Firma
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
