import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly session = this.authService.session;
  readonly successMessage = signal<string | null>(history.state?.message ?? null);
  readonly isLoading = signal(false);

  logout(): void {
    this.isLoading.set(true);
    this.authService.logout().subscribe({
      next: (response) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], { state: { message: response.message } });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(
          err.error?.message ?? 'No se pudo cerrar sesión. Intenta de nuevo.',
          'Cerrar',
          { duration: 4000, panelClass: 'snack-error' },
        );
      },
    });
  }
}
