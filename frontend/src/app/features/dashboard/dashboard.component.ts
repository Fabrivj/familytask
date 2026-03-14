import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly session = computed(() => this.authService.session());

  // Incoming success message (e.g. from family creation)
  readonly successMessage = signal<string | null>(history.state?.message ?? null);

  // Logout
  readonly logoutError = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    this.logoutError.set(null);
    this.authService.logout().subscribe({
      next: (response) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], { state: { message: response.message } });
      },
      error: (err) => {
        this.logoutError.set(err.error?.message ?? 'No se pudo cerrar sesión. Intenta de nuevo.');
      },
    });
  }
}
