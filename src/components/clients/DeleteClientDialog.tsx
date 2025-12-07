import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteClient } from '@/hooks/useClients';
import { Client } from '@/types/clients';

interface DeleteClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ client, open, onOpenChange }: DeleteClientDialogProps) {
  const { mutate: deleteClient, isPending } = useDeleteClient();

  const handleDelete = () => {
    if (!client) return;
    
    deleteClient(client.id, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const clientName = client?.tipo === 'empresa' 
    ? client?.razon_social 
    : client?.nombre_comercial;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción suspenderá al cliente <strong>{clientName}</strong>. 
            El cliente no será eliminado permanentemente, pero quedará marcado como suspendido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
