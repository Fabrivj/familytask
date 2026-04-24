import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { MembersService } from '@core/services/members.service';
import { MemberItem } from '@core/models/member.model';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { PageLayoutComponent } from '../page-layout/page-layout.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

// Layout compartido para todas las páginas autenticadas con sidebar.
// Centraliza el top-bar, el sidebar y el flujo de logout para que
// cada página solo se preocupe de su propio contenido.
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageLayoutComponent, SidebarComponent, TopBarComponent, BottomNavComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  private readonly membersService = inject(MembersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly shortName = this.authService.shortName;
  readonly pictureUrl = computed(() => this.authService.session()?.pictureUrl ?? '');
  readonly familyName = this.authService.activeFamilyName;
  readonly userRole = this.authService.activeRoleLabel;
  readonly logoutLoading = signal(false);
  readonly childStats = signal<MemberItem | null>(null);

  readonly childXpPercent = computed(() => {
    const stats = this.childStats();
    if (stats?.currentLevel == null || stats.xpToNextLevel == null) return 0;
    const xpNeeded = 100 * (stats.currentLevel + 1);
    const xpInLevel = xpNeeded - stats.xpToNextLevel;
    return Math.max(0, Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)));
  });

  constructor() {
    effect(() => {
      const family = this.authService.activeFamily();
      if (family?.role !== 'CHILD') {
        this.childStats.set(null);
        return;
      }
      this.membersService
        .getMyStats(family.familyId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (stats) => this.childStats.set(stats),
          error: () => this.childStats.set(null),
        });
    });
  }

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
