import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useRenewalHistory,
  type SubscriptionRenewal,
} from '@/hooks/useSubscriptionRenewals';

const clp = (n?: number | null) =>
  n == null ? '-' : `$${Math.round(n).toLocaleString('es-CL')}`;

const fmt = (d?: string | null, withTime = false) =>
  d ? format(new Date(d), withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy') : '-';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value || '-'}</p>
    </div>
  );
}

export function RenewalDetailDialog({
  renewal,
  open,
  onOpenChange,
}: {
  renewal: SubscriptionRenewal | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const sub = renewal?.subscription ?? null;
  const { data: history, isLoading } = useRenewalHistory(sub?.id);

  const clientName =
    sub?.client?.razon_social || sub?.client?.nombre_comercial || 'Sin cliente';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {sub?.folio ?? 'Renovación'}
            {sub?.estado && <Badge variant="secondary">{sub.estado}</Badge>}
          </DialogTitle>
          <DialogDescription>
            Renovación registrada el {fmt(renewal?.renewed_at, true)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3">
            <p className="text-sm font-semibold">Cliente</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" value={clientName} />
              <Field label="Correo" value={sub?.client?.email_principal} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-sm font-semibold">Vehículo</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Patente" value={sub?.vehicle?.patente} />
              <Field label="Marca" value={sub?.vehicle?.marca} />
              <Field label="Modelo" value={sub?.vehicle?.modelo} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-sm font-semibold">Plan renovado</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Plan" value={sub?.plan?.nombre} />
              <Field label="Precio" value={clp(sub?.plan?.precio)} />
              <Field
                label="Período"
                value={sub?.plan?.periodo_meses ? `${sub.plan.periodo_meses} meses` : '-'}
              />
              <Field label="Fecha anterior" value={fmt(renewal?.fecha_anterior)} />
              <Field label="Fecha nueva" value={fmt(renewal?.fecha_nueva)} />
              <Field label="Fecha de renovación" value={fmt(renewal?.renewed_at, true)} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-sm font-semibold">Equipo</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Nº IMEI" value={sub?.imei_gps} />
              <Field label="Nº PCS" value={sub?.imei_pcs || sub?.numero_pcs} />
              <Field label="Modelo GPS" value={sub?.modelo_gps} />
              <Field label="Compañía" value={sub?.compania} />
              <Field label="Instalador" value={sub?.instalador} />
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-sm font-semibold">Historial de renovaciones</p>
            {isLoading ? (
              <div className="flex justify-center py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : history && history.length > 0 ? (
              <ul className="space-y-2">
                {history.map(h => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{fmt(h.renewed_at, true)}</span>
                    <span className="text-muted-foreground">
                      {fmt(h.fecha_anterior)} → {fmt(h.fecha_nueva)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin renovaciones registradas.</p>
            )}
          </section>

          {sub?.id && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate(`/subscriptions/${sub.id}`);
              }}
            >
              Ver suscripción completa <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
