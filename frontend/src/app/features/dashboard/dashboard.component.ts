import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { MembersService } from '../../core/services/members.service';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';
import { ChildStatsComponent } from '../../shared/components/child-stats/child-stats.component';
import { MemberItem } from '../../core/models/member.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, AppShellComponent, PageHeaderComponent, RoleBadgeComponent, ChildStatsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly membersService = inject(MembersService);

  readonly session = this.authService.session;
  readonly shortName = this.authService.shortName;
  readonly successMessage = signal<string | null>(history.state?.message ?? null);

  readonly isChild = computed(() => this.authService.activeFamily()?.role === 'CHILD');
  readonly selfMember = signal<MemberItem | null>(null);

  ngOnInit(): void {
    const activeFamilyId = this.session()?.activeFamilyId;
    if (activeFamilyId && this.isChild()) {
      this.membersService.getMyStats(activeFamilyId).subscribe({
        next: (me) => this.selfMember.set(me),
      });
    }
  }
}
