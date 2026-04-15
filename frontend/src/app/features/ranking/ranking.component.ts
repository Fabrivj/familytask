import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { MembersService } from '@core/services/members.service';
import { MemberItem } from '@core/models/member.model';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { injectLoadingState } from '@core/utils/loading-state';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [
    MatIconModule,
    AppShellComponent,
    PageHeaderComponent,
    UserAvatarComponent,
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly membersService = inject(MembersService);

  readonly members = signal<MemberItem[]>([]);
  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;
  readonly error = this.ls.error;
  readonly isDisabled = signal(false);

  ngOnInit(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) {
      this.router.navigate(['/family/select']);
      return;
    }
    this.loadRanking(familyId);
  }

  private loadRanking(familyId: number): void {
    this.isDisabled.set(false);

    this.ls.run(this.membersService.getRanking(familyId), {
      next: (data) => this.members.set(data),
      error: (err: any) => {
        if (err?.error?.code === 'RANKING_DISABLED') {
          this.isDisabled.set(true);
        }
      },
    });
  }

  retry(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (familyId) this.loadRanking(familyId);
  }
}
