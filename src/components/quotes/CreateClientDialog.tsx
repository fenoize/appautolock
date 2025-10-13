import { useState } from 'react';
import { useCreateClient } from '@/hooks/useClients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (clientId: string) => void;
  branchId?: string;
}

export function CreateClientDialog({ 
  open, 
  onOpenChange, 
  onClientCreated,
  branchId 
}: CreateClientDialogProps) {
  const createClient = useCreateClient();
  const [formData, setFormData] = useState({
    tipo: 'persona' as 'persona' | 'empresa',
    nombre_comercial: '',
    razon_social: '',
    rut: '',
    dv: '',
    email_principal: '',
    branch_id: branchId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const client = await createClient.mutateAsync(formData as any);
      onClientCreated(client.id);
      onOpenChange(false);
      setFormData({
        tipo: 'persona',
        nombre_comercial: '',
        razon_social: '',
        rut: '',
        dv: '',
        email_principal: '',
        branch_id: branchId || '',
      });
    } catch (error) {
      console.error('Error al crear cliente:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo de Cliente</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="persona">Persona</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.tipo === 'empresa' && (
            <div>
              <Label>Razón Social *</Label>
              <Input
                value={formData.razon_social}
                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                placeholder="Empresa S.A."
                required
              />
            </div>
          )}

          <div>
            <Label>Nombre Comercial *</Label>
            <Input
              value={formData.nombre_comercial}
              onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
              placeholder={formData.tipo === 'persona' ? 'Juan Pérez' : 'Mi Empresa'}
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <Label>RUT *</Label>
              <Input
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                placeholder="12345678"
                required
              />
            </div>
            <div>
              <Label>DV *</Label>
              <Input
                value={formData.dv}
                onChange={(e) => setFormData({ ...formData, dv: e.target.value })}
                placeholder="9"
                maxLength={1}
                required
              />
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email_principal}
              onChange={(e) => setFormData({ ...formData, email_principal: e.target.value })}
              placeholder="email@ejemplo.com"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
