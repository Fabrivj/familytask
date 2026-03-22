import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { TopBarComponent } from '../../shared/components/top-bar/top-bar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, PageLayoutComponent, TopBarComponent, SidebarComponent, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly session = this.authService.session;
  readonly successMessage = signal<string | null>(history.state?.message ?? null);
  readonly isLoading = signal(false);

  readonly shortName = computed(() => this.authService.session()?.name?.split(' ')[0] ?? '');
  readonly familyName = computed(() => this.authService.activeFamily()?.familyName ?? '');
  readonly userRoleLabel = this.authService.activeRoleLabel;

  logout(): void {
    this.isLoading.set(true);
    this.authService.performLogout().subscribe({
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
