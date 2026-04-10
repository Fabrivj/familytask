import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { MembersService } from '../../core/services/members.service';
import { RedemptionHistoryService } from '../../core/services/redemption-history.service';
import { RedemptionHistoryResponse, RedemptionStatus } from '../../core/models/redemption.model';
import { MemberItem } from '../../core/models/member.model';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-redemption-history',
  imports: [
    DatePipe,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
    PageHeaderComponent,
    UserAvatarComponent,
  ],
  templateUrl: './redemption-history.component.html',
  styleUrl: './redemption-history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedemptionHistoryComponent {
  private readonly authService       = inject(AuthService);
  private readonly membersService    = inject(MembersService);
  private readonly redemptionService = inject(RedemptionHistoryService);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);

  // Filter signals
  readonly selectedMemberId = signal<number | null>(null);
  readonly selectedStatus   = signal<RedemptionStatus | ''>('');
  readonly dateFrom         = signal<string>('');
  readonly dateTo           = signal<string>('');

  // Data signals
  readonly members     = signal<MemberItem[]>([]);
  readonly redemptions = signal<RedemptionHistoryResponse[]>([]);
  readonly isLoading   = signal(false);
  readonly error       = signal('');

  readonly subtitle = computed(() => {
    const n = this.redemptions().length;
    return `${n} canje${n !== 1 ? 's' : ''} registrado${n !== 1 ? 's' : ''}`;
  });

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id) {
        this.loadMembers(id);
        this.loadHistory(id);
      }
    });
  }

  private loadMembers(familyId: number): void {
    this.membersService.getMembers(familyId).subscribe({
      next: (res) => this.members.set(res.members),
      error: () => { /* member filter is optional — fail silently */ },
    });
  }

  private loadHistory(familyId: number): void {
    this.isLoading.set(true);
    this.error.set('');

    const status = this.selectedStatus();

    this.redemptionService.getHistory({
      familyId,
      memberId:  this.selectedMemberId() ?? undefined,
      status:    status || undefined,
      dateFrom:  this.dateFrom()  || undefined,
      dateTo:    this.dateTo()    || undefined,
    }).subscribe({
      next: (list) => {
        this.redemptions.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar el historial de canjes.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    const id = this.familyId();
    if (id) this.loadHistory(id);
  }

  clearFilters(): void {
    this.selectedMemberId.set(null);
    this.selectedStatus.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.applyFilters();
  }

  statusLabel(status: RedemptionStatus): string {
    return status === 'PENDING' ? 'Pendiente' : 'Entregado';
  }
}
