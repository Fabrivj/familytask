/** Formats an ISO date string to a short localized label ("Hoy", "13 ene"). */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
}

/** Converts a Date object to an ISO date string (YYYY-MM-DD). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
