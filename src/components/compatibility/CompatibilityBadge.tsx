import { CompatEstado } from '@/hooks/useCompatibility';
import { cn } from '@/lib/utils';

interface Props {
  estado?: CompatEstado | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const MAP: Record<CompatEstado, { label: string; emoji: string; cls: string }> = {
  verde: { label: 'Compatible', emoji: '🟢', cls: 'bg-[#22c55e]/15 text-[#15803d] border-[#22c55e]/40' },
  amarillo: {
    label: 'Con observaciones',
    emoji: '🟡',
    cls: 'bg-[#eab308]/15 text-[#854d0e] border-[#eab308]/40',
  },
  rojo: { label: 'No compatible', emoji: '🔴', cls: 'bg-[#ef4444]/15 text-[#b91c1c] border-[#ef4444]/40' },
};

export function CompatibilityBadge({ estado, size = 'sm', showLabel = true, className }: Props) {
  if (!estado) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
          'bg-muted text-muted-foreground border-border',
          size === 'md' && 'text-sm px-2.5 py-1',
          className,
        )}
      >
        ⚪ {showLabel && 'Sin datos'}
      </span>
    );
  }
  const cfg = MAP[estado];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        cfg.cls,
        size === 'md' && 'text-sm px-2.5 py-1',
        className,
      )}
    >
      {cfg.emoji} {showLabel && cfg.label}
    </span>
  );
}
