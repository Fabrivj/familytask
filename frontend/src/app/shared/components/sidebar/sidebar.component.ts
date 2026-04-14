import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';

/**
 * Collapsible icon sidebar for full-width dashboard pages.
 * Highlights the active item based on the current route.
 *
 * Usage (inside a page-layout variant="full", after the top-bar):
 *   <div class="app-body">
 *     <app-sidebar />
 *     <main class="content">...</main>
 *   </div>
 */
@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly permissionsService = inject(PermissionsService);

  readonly activeUrl = computed(() => this.router.url);

  readonly isParent = this.permissionsService.isParent;
  readonly hasMultipleFamilies = computed(() => this.authService.families().length > 1);

  isActive(route: string): boolean {
    return this.activeUrl().startsWith(route);
  }

  navigate(route: string | null): void {
    if (route) this.router.navigate([route]);
  }
}
