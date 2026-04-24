import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { ChildDashboardComponent } from './child-dashboard/child-dashboard.component';
import { ParentDashboardComponent } from './parent-dashboard/parent-dashboard.component';

@Component({
  selector: 'app-dashboard',
  imports: [AppShellComponent, ChildDashboardComponent, ParentDashboardComponent],
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
