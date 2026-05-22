
# Rediseño visual global inspirado en Highdmin

Objetivo: lograr una apariencia profesional y moderna (estilo Highdmin) sin cambiar lógica de negocio. Todos los cambios son visuales y se aplican vía tokens del design system, de modo que se propaguen automáticamente a toda la app.

## 1. Design tokens (`src/index.css` + `tailwind.config.ts`)

Actualizar variables HSL para reflejar la paleta de referencia, manteniendo el naranjo corporativo como acento:

- `--background`: gris muy claro `#f4f6f9` (210 20% 97%)
- `--card`: blanco puro
- `--foreground`: gris oscuro `#313a46`
- `--muted` / `--muted-foreground`: grises suaves `#f8f9fa` / `#6c757d`
- `--border`: gris claro `#e9ecef`
- `--primary`: naranjo `#F97316` (se mantiene)
- `--sidebar-background`: azul oscuro `#1a1f2e`
- `--sidebar-foreground`: blanco
- `--sidebar-accent`: hover sutil sobre el oscuro
- `--sidebar-primary`: naranjo para item activo
- Estados semánticos nuevos: `--success` (#28a745), `--warning` (#ffc107), `--info` (#0d6efd), `--destructive` (#dc3545), `--neutral` (#6c757d) más sus `-soft` para badges.
- Sombras: `--shadow-card: 0 2px 8px rgba(0,0,0,0.07)`
- Radio: `--radius: 0.625rem` (10px) para cards; pills 20px vía utility.
- Tipografía: importar **Inter** desde Google Fonts en `index.html`, setear `font-family` base.

## 2. Layout (`AppLayout`, `AppTopbar`, `AppSidebar`)

- Topbar blanco con `shadow-sm`, a la izquierda el título de sección activa (derivado de la ruta vía un pequeño helper), a la derecha el avatar con nombre del usuario. El logo se mueve al sidebar.
- Sidebar: fondo `--sidebar-background` (oscuro), íconos blancos; ítem activo: ícono naranjo + barra/fondo sutil naranjo translúcido. Grupos colapsables conservan el comportamiento actual.
- Contenido: fondo `--background` con padding 24px. Sidebar y topbar fijos, solo el contenido scrollea (ya está así, ajustar paddings y colores).

## 3. Cards y contenedores (`PageContainer`, `PageHeader`, shadcn `card.tsx`)

- `Card`: `rounded-[10px]`, `shadow-card`, `p-6`, sin borde grueso.
- `CardHeader`: título a la izquierda en bold, divisor sutil 1px `--border` debajo.
- `PageContainer`: spacing vertical consistente `space-y-6`, padding 24px.

## 4. Tablas (shadcn `table.tsx` + tablas existentes)

Modificar solo el componente base para que el cambio se propague:

- `<thead>`: fondo `#f8f9fa`, texto `uppercase`, `text-[11px]`, `tracking-wider`, color `--muted-foreground`.
- Filas: hover suave; opcional striped via clase utility.
- Wrapper con `overflow-x-auto` dentro del card.
- Celdas: `truncate` + tooltip cuando aplique (utility class y patrón aplicado en tablas grandes: Clientes, Vehículos, Cotizaciones, OTs, Inventario, Suscripciones, Usuarios).
- Alineación: añadir variantes `text-right` para numéricas y `text-center` para estado en cada tabla.

## 5. Badges de estado (`badge.tsx` + badges específicos)

- Crear variantes: `success`, `warning`, `info`, `neutral`, `destructive` usando los `-soft` como background y color sólido como texto.
- Estilo pill: `rounded-full`, `px-2.5 py-0.5`, `text-[11px]`, `font-semibold`.
- Refactor de `QuoteStatusBadge`, `WOStatusBadge`, `ClientStatusBadge`, `UserStatusBadge`, `SubscriptionStatusBadge`, `StockBadge`, `CompatibilityBadge`, `RoleBadge` para usar las nuevas variantes (mapping de estado → variante).

## 6. Botones (`button.tsx`)

- Variante `default`: naranjo sólido, texto blanco, `rounded-md` (6px), sombra suave.
- Variante `outline`: fondo blanco, borde gris, texto oscuro.
- Variante `ghost`/`icon`: usar para acciones en tabla.
- En tablas (Clientes, Vehículos, Cotizaciones, OTs, Inventario, Usuarios, Suscripciones): reemplazar botones de texto "Ver/Editar/Eliminar" por íconos `Eye`/`Pencil`/`Trash2` 16px con `Tooltip`. Mantener los `DropdownMenu` donde ya existen.

## 7. Formularios y modales (`input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `dialog.tsx`)

- Inputs/Select/Textarea: `rounded-md`, borde `--border`, focus ring naranjo.
- Label arriba siempre, `text-[13px]`, color `--foreground`.
- Dialog: header con título en bold, body blanco, footer alineado a la derecha (ya casi así, ajustar spacing y tipografía).

## 8. Tipografía y espaciado

- Body 14px base.
- `PageHeader` título 24px/700.
- Subtítulos de card 16px/600.
- Eliminar tamaños <12px excepto badges.
- Espaciado vertical entre secciones: `space-y-6` (24px) estándar.

## Archivos a modificar (resumen)

- `index.html` — import Inter
- `src/index.css` — tokens, sombras, radius, font-family, utilities (pill, table-head, etc.)
- `tailwind.config.ts` — colores semánticos (success, warning, info, neutral, soft variants), boxShadow card
- `src/components/layout/AppTopbar.tsx` — título sección + avatar+nombre
- `src/components/layout/AppSidebar.tsx` — estilos activos naranjo, ajuste header con logo
- `src/components/layout/AppLayout.tsx` — paddings/fondo
- `src/components/ui/card.tsx`, `table.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `dialog.tsx`, `label.tsx`
- `src/components/shared/PageContainer.tsx`, `PageHeader.tsx`
- Badges específicos: `Quote/WO/Client/User/Subscription/Stock/Compatibility/RoleBadge`
- Tablas existentes (`ClientsTable`, `VehiclesTable`, `QuotesTable`, `ProductsTable`, `UsersTable`, `WOList`, `SubscriptionList`, etc.) — reemplazo de botones texto por iconos+tooltip, alineación numérica/estado.

## Fuera de alcance

- Lógica de negocio, queries Supabase, rutas, permisos, validaciones.
- Cambios en el módulo de Compatibilidad de Productos (semáforo) más allá de heredar los tokens nuevos.
