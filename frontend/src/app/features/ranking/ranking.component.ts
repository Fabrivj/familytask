import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { MembersService } from '../../core/services/members.service';
import { MemberItem } from '../../core/models/member.model';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

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
  readonly isLoading = signal(true);
  readonly error = signal('');
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
    this.isLoading.set(true);
    this.error.set('');
    this.isDisabled.set(false);

    this.membersService.getRanking(familyId).subscribe({
      next: (data) => {
        this.members.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.error?.code === 'RANKING_DISABLED') {
          this.isDisabled.set(true);
          this.error.set('El ranking no está habilitado para esta familia.');
        } else {
          this.error.set('No se pudo cargar el ranking. Intenta de nuevo.');
        }
      },
    });
  }

  retry(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (familyId) this.loadRanking(familyId);
  }
}
