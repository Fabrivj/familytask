import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { PageLayoutComponent } from '../page-layout/page-layout.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

// Layout compartido para todas las páginas autenticadas con sidebar.
// Centraliza el top-bar, el sidebar y el flujo de logout para que
// cada página solo se preocupe de su propio contenido.
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageLayoutComponent, SidebarComponent, TopBarComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly shortName = this.authService.shortName;
  readonly pictureUrl = computed(() => this.authService.session()?.pictureUrl ?? '');
  readonly familyName = this.authService.activeFamilyName;
  readonly userRole = this.authService.activeRoleLabel;
  readonly logoutLoading = signal(false);

  onLogout(): void {
    this.logoutLoading.set(true);
    this.authService.performLogout().subscribe({
      error: (err) => {
        this.logoutLoading.set(false);
        this.snackBar.open(
          err.error?.message ?? 'No se pudo cerrar sesión. Intenta de nuevo.',
          'Cerrar',
          { duration: 4000, panelClass: 'snack-error' }
        );
      },
    });
  }
}
