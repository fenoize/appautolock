import { useState } from 'react';
import { useUploadEvidence } from '@/hooks/useWorkOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface WOEvidenceUploaderProps {
  woId: string;
  existingUrls?: string[];
  onUpdate: (urls: string[]) => void;
  readonly?: boolean;
  category: 'pre' | 'post';
  title: string;
  description?: string;
}

export const WOEvidenceUploader = ({ 
  woId, 
  existingUrls = [], 
  onUpdate, 
  readonly = false,
  category,
  title,
  description
}: WOEvidenceUploaderProps) => {
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const uploadMutation = useUploadEvidence();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    if (urls.length + files.length > 5) {
      toast.error('Máximo 5 fotos por sección');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(file => 
        uploadMutation.mutateAsync({ woId, file, category })
      );
      
      
      const newUrls = await Promise.all(uploadPromises);
      const updatedUrls = [...urls, ...newUrls];
      setUrls(updatedUrls);
      onUpdate(updatedUrls);
      
      toast.success(`${files.length} foto(s) subida(s)`);
    } catch (error) {
      toast.error('Error al subir fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (urlToRemove: string) => {
    const updatedUrls = urls.filter(url => url !== urlToRemove);
    setUrls(updatedUrls);
    onUpdate(updatedUrls);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidencias Fotográficas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readonly && (
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="evidence-upload"
              disabled={uploading || urls.length >= 10}
            />
            <Button
              onClick={() => document.getElementById('evidence-upload')?.click()}
              disabled={uploading || urls.length >= 10}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Subiendo...' : 'Subir Fotos'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {urls.length} / 10 fotos. Máximo 10 por OT.
            </p>
          </div>
        )}

        {urls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {urls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Evidencia ${idx + 1}`}
                  className="w-full h-48 object-cover rounded border"
                />
                {!readonly && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(url)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay evidencias fotográficas
          </p>
        )}
      </CardContent>
    </Card>
  );
};
