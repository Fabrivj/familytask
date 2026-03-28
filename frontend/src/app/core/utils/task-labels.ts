export function priorityLabel(p: string): string {
  return ({ HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA' } as Record<string, string>)[p] ?? p;
}
