import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Phone, Mail, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RenewalData {
  folio: string;
  fecha_vencimiento: string;
  estado: string;
  cliente: string;
  vehiculo: string | null;
  plan: { nombre: string; precio: number; periodo_meses: number } | null;
  empresa: {
    nombre: string; logo: string; logoDark: string;
    telefono: string; email: string; web: string;
  };
}

function clp(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default function RenovarPage() {
  const [params] = useSearchParams();
  const subId = params.get("sub");
  const planId = params.get("plan");
  const [data, setData] = useState<RenewalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const pathname = window.location.pathname;
  const isSuccess = pathname.endsWith("/success");
  const isFailure = pathname.endsWith("/failure");
  const isPending = pathname.endsWith("/pending");
  const isResultPage = isSuccess || isFailure || isPending;

  useEffect(() => {
    if (isResultPage) { setLoading(false); return; }
    if (!subId) { setError("Link inválido"); setLoading(false); return; }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/renewal-info?sub=${subId}${planId ? `&plan=${planId}` : ""}`;

    fetch(url, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("No se pudo cargar la información"))
      .finally(() => setLoading(false));
  }, [subId, planId, isResultPage]);

  const handlePagar = async () => {
    if (!subId) return;
    setPaying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mp-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ sub_id: subId, plan_id: planId }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      window.location.href = result.checkout_url;
    } catch (e: any) {
      alert(e.message || "No se pudo iniciar el pago. Intenta nuevamente.");
      setPaying(false);
    }
  };

  if (isSuccess) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">¡Pago recibido!</h1>
        <p className="text-muted-foreground">Tu suscripción GPS ha sido renovada exitosamente. Recibirás una confirmación por correo.</p>
        <div className="text-sm text-muted-foreground">Folio de suscripción: <span className="font-mono font-medium">{subId}</span></div>
      </div>
    </div>
  );

  if (isFailure) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold">Pago no completado</h1>
        <p className="text-muted-foreground">El pago no se pudo procesar. Puedes intentarlo nuevamente.</p>
        <Button onClick={() => { window.location.href = `/renovar?sub=${subId}${planId ? `&plan=${planId}` : ""}`; }}>
          Intentar nuevamente
        </Button>
      </div>
    </div>
  );

  if (isPending) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <Clock className="h-16 w-16 text-amber-500 mx-auto" />
        <h1 className="text-2xl font-bold">Pago en proceso</h1>
        <p className="text-muted-foreground">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
      </div>
    </div>
  );


  const vencimiento = data ? new Date(data.fecha_vencimiento + "T00:00:00") : null;
  const diasRestantes = vencimiento
    ? Math.ceil((vencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const whatsappMsg = data
    ? encodeURIComponent(`Hola, quiero renovar mi suscripción GPS ${data.folio}${data.vehiculo ? ` (${data.vehiculo})` : ""}.`)
    : "";
  const whatsappUrl = data?.empresa.telefono
    ? `https://wa.me/${data.empresa.telefono.replace(/\D/g, "")}?text=${whatsappMsg}`
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {data?.empresa.logo && (
          <div className="flex justify-center">
            <img src={data.empresa.logo} alt={data.empresa.nombre} className="h-12 object-contain" />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="font-medium">Link no válido</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className={`rounded-lg p-4 text-center ${
              diasRestantes !== null && diasRestantes <= 0
                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                : diasRestantes !== null && diasRestantes <= 7
                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            }`}>
              <Clock className="h-5 w-5 mx-auto mb-1" />
              {diasRestantes !== null && diasRestantes <= 0 ? (
                <p className="font-semibold">Tu suscripción GPS ha vencido</p>
              ) : (
                <p className="font-semibold">Tu suscripción GPS vence en {diasRestantes} día{diasRestantes !== 1 ? "s" : ""}</p>
              )}
              <p className="text-sm mt-0.5">
                {vencimiento?.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Folio</span>
                  <span className="font-mono font-medium">{data.folio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{data.cliente}</span>
                </div>
                {data.vehiculo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehículo</span>
                    <span className="font-medium">{data.vehiculo}</span>
                  </div>
                )}
                {data.plan && (
                  <>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{data.plan.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-bold text-base">{clp(data.plan.precio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">
                        {data.plan.periodo_meses === 1 ? "1 mes" : `${data.plan.periodo_meses} meses`}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Contáctanos para renovar tu suscripción
              </p>

              {whatsappUrl && (
                <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Phone className="mr-2 h-4 w-4" />
                    Renovar por WhatsApp
                  </a>
                </Button>
              )}

              {data.empresa.email && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${data.empresa.email}?subject=Renovación suscripción GPS ${data.folio}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Renovar por correo
                  </a>
                </Button>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                Pago en línea disponible próximamente
              </div>
            </div>

            {data.empresa.web && (
              <p className="text-center text-xs text-muted-foreground">
                <a href={data.empresa.web} className="hover:underline">{data.empresa.nombre}</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
