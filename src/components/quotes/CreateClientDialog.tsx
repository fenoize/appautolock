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
import { Textarea } from '@/components/ui/textarea';
import { validateRUT, formatRutInput, splitRutInput } from '@/lib/rut-validation';
import { toast } from 'sonner';

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
    pasaporte: '',
    giro: '',
    email_principal: '',
    telefonos: [''],
    estado: 'prospecto' as const,
    notas: '',
    branch_id: branchId || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { rut, dv } = splitRutInput(formData.rut);

    // Validar RUT si se proporciona
    if (formData.rut) {
      if (!validateRUT(rut, dv)) {
        toast.error('RUT inválido');
        return;
      }
    }

    // Validar que tenga RUT o pasaporte
    if (!formData.rut && !formData.pasaporte) {
      toast.error('Debe ingresar RUT o Pasaporte');
      return;
    }
    
    try {
      const dataToSend = {
        ...formData,
        rut,
        dv,
        telefonos: formData.telefonos.filter(t => t.trim() !== ''),
        branch_id: formData.branch_id || undefined,
      };
      
      const client = await createClient.mutateAsync(dataToSend as any);
      onClientCreated(client.id);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        tipo: 'persona',
        nombre_comercial: '',
        razon_social: '',
        rut: '',
        dv: '',
        pasaporte: '',
        giro: '',
        email_principal: '',
        telefonos: [''],
        estado: 'prospecto',
        notas: '',
        branch_id: branchId || undefined,
      });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      toast.error('Error al crear cliente');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          <div>
            <Label>RUT</Label>
            <Input
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: formatRutInput(e.target.value) })}
              placeholder="19.974.581-6"
              maxLength={12}
            />
          </div>

          <div>
            <Label>Pasaporte (opcional)</Label>
            <Input
              value={formData.pasaporte}
              onChange={(e) => setFormData({ ...formData, pasaporte: e.target.value })}
              placeholder="AB123456"
            />
          </div>

          {formData.tipo === 'empresa' && (
            <div>
              <Label>Giro</Label>
              <Input
                value={formData.giro}
                onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                placeholder="Comercio al por mayor"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.telefonos[0]}
                onChange={(e) => setFormData({ ...formData, telefonos: [e.target.value] })}
                placeholder="+56912345678"
              />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <Select 
              value={formData.estado}
              onValueChange={(v: any) => setFormData({ ...formData, estado: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecto">Prospecto</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="mora">Mora</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              placeholder="Información adicional sobre el cliente..."
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
