import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { ChildDashboardComponent } from './child-dashboard/child-dashboard.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, AppShellComponent, PageHeaderComponent, RoleBadgeComponent, ChildDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  readonly session = this.authService.session;
  readonly successMessage = signal<string | null>(history.state?.message ?? null);
  readonly isChild = computed(() => this.authService.activeFamily()?.role === 'CHILD');
}
