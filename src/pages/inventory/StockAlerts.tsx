import { useEffect, useState } from 'react';
import { useStockAlerts, useResolverAlerta } from '@/hooks/useStockAlerts';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, CheckCircle, Package, TrendingDown, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { animations } from '@/lib/animations';
import { StockBadge } from '@/components/inventory/StockBadge';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function StockAlerts() {
  const { data: alerts, isLoading } = useStockAlerts(false);
  const resolverAlerta = useResolverAlerta();
  const navigate = useNavigate();
  const [lastWoByProduct, setLastWoByProduct] = useState<Record<string, { wo_id: string; folio: string; fecha: string }>>({});

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;
    const productIds = Array.from(new Set(alerts.map((a: any) => a.product?.id).filter(Boolean)));
    if (productIds.length === 0) return;
    supabase
      .from('stock_moves')
      .select('product_id, fecha, wo_id, wo:work_orders(id, folio)')
      .in('product_id', productIds)
      .eq('tipo', 'consumo')
      .not('wo_id', 'is', null)
      .order('fecha', { ascending: false })
      .then(({ data }) => {
        const map: Record<string, { wo_id: string; folio: string; fecha: string }> = {};
        (data || []).forEach((row: any) => {
          if (!map[row.product_id] && row.wo) {
            map[row.product_id] = { wo_id: row.wo_id, folio: row.wo.folio, fecha: row.fecha };
          }
        });
        setLastWoByProduct(map);
      });
  }, [alerts]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Alertas de Stock"
          description="Productos con stock crítico o bajo mínimo"
        />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Alertas de Stock"
          description="Productos con stock crítico o bajo mínimo"
        />
        <EmptyState
          icon={CheckCircle}
          title="No hay alertas de stock"
          description="Todos los productos tienen stock suficiente. ¡Todo en orden!"
          action={
            <Button onClick={() => navigate('/inventory')}>
              <Package className="mr-2 h-4 w-4" />
              Ver Inventario
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className={animations.pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Alertas de Stock</h1>
          <p className="text-muted-foreground mt-1">
            Productos con stock crítico o bajo mínimo
          </p>
        </div>
        <Badge variant="destructive" className="text-base px-4 py-2">
          {alerts.length} {alerts.length === 1 ? 'Alerta' : 'Alertas'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert, index) => (
          <Card
            key={alert.id}
            className={cn(
              "border-l-4",
              alert.tipo === 'sin_stock' ? "border-l-destructive" : "border-l-[hsl(var(--warning))]",
              "hover:shadow-lg transition-all duration-200"
            )}
            style={{ 
              animationDelay: `${Math.min(index * 50, 300)}ms` 
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar del producto */}
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className={cn(
                      "font-semibold text-base",
                      alert.tipo === 'sin_stock' 
                        ? "bg-destructive-soft text-destructive"
                        : "bg-yellow-50 text-warning"
                    )}>
                      {alert.product?.nombre?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Info del producto */}
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {alert.product?.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>SKU: {alert.product?.sku}</span>
                      <span>•</span>
                      <Badge variant="soft" className="font-normal">
                        {alert.location?.nombre}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Badge de tipo */}
                <StockBadge 
                  stock={alert.stock_actual} 
                  stockMinimo={alert.stock_minimo}
                />
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                {/* Métricas de stock */}
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Stock Actual</p>
                    <p className="text-2xl font-bold font-mono">
                      {alert.stock_actual}
                    </p>
                  </div>
                  
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Stock Mínimo</p>
                    <p className="text-2xl font-semibold font-mono text-muted-foreground">
                      {alert.stock_minimo}
                    </p>
                  </div>
                  
                  <div className="ml-4">
                    <p className="text-xs text-muted-foreground mb-1">Diferencia</p>
                    <p className={cn(
                      "text-lg font-semibold font-mono",
                      alert.stock_actual < alert.stock_minimo 
                        ? "text-destructive"
                        : "text-accent"
                    )}>
                      {alert.stock_actual - alert.stock_minimo > 0 ? '+' : ''}
                      {alert.stock_actual - alert.stock_minimo}
                    </p>
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolverAlerta.mutate(alert.id)}
                    disabled={resolverAlerta.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolver
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => navigate(`/inventory/products/${alert.product?.id}`)}
                  >
                    Ver Producto
                  </Button>
                </div>
              </div>
              
              {/* Timestamp */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Alerta creada el {format(new Date(alert.created_at), "PPP 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
