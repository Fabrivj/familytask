import { MatSnackBar } from '@angular/material/snack-bar';
import { EarnedBadge } from '../models/badge.model';

export function notifyEarnedBadges(snackBar: MatSnackBar, badges: EarnedBadge[]): void {
  if (!badges?.length) return;
  const names = badges.map(b => b.name).join(', ');
  setTimeout(() => {
    snackBar.open(`Nuevo logro: ${names}`, 'Cerrar', { duration: 5000, panelClass: 'snack-success' });
  }, 1500);
}
