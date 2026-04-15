export function priorityLabel(p: string): string {
  return ({ HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA' } as Record<string, string>)[p] ?? p;
}

export function statusLabel(s: string | null): string {
  return (
    { PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', IN_REVIEW: 'En revisión', COMPLETED: 'Completada' } as Record<string, string>
  )[s ?? ''] ?? '—';
}

export function statusIcon(status: string): string {
  if (status === 'PENDING') return 'schedule';
  if (status === 'IN_PROGRESS') return 'play_arrow';
  if (status === 'COMPLETED') return 'check_circle';
  return 'help_outline';
}
