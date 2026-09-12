// work_orders no tiene columna "referencia": se guarda como una línea marcada en notas.
const MARKER = 'Referencia:';

export function parseNotasReferencia(notas?: string | null): { notas: string; referencia: string } {
  const raw = notas || '';
  const lines = raw.split('\n');
  const idx = lines.findIndex((l) => l.trim().startsWith(MARKER));
  if (idx === -1) return { notas: raw, referencia: '' };
  const referencia = lines[idx].trim().slice(MARKER.length).trim();
  lines.splice(idx, 1);
  return { notas: lines.join('\n').trim(), referencia };
}

export function buildNotas(notas?: string | null, referencia?: string | null): string | null {
  const base = (notas || '').trim();
  const ref = (referencia || '').trim();
  const combined = [base, ref ? `${MARKER} ${ref}` : ''].filter(Boolean).join('\n\n');
  return combined || null;
}
