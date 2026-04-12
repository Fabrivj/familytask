import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { MembersService } from '../../../core/services/members.service';
import { RedemptionHistoryService } from '../../../core/services/redemption-history.service';
import { MemberItem } from '../../../core/models/member.model';
import { RedemptionHistoryResponse, RedemptionStatus } from '../../../core/models/redemption.model';
import { UserChipComponent } from '../user-chip/user-chip.component';

@Component({
  selector: 'app-redemption-history-panel',
  imports: [
    DatePipe,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UserChipComponent,
  ],
  templateUrl: './redemption-history-panel.component.html',
  styleUrl: './redemption-history-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedemptionHistoryPanelComponent {
  private readonly authService = inject(AuthService);
  private readonly membersService = inject(MembersService);
  private readonly redemptionHistoryService = inject(RedemptionHistoryService);

  readonly collapsibleFilters = input(false);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);

  readonly members = signal<MemberItem[]>([]);
  readonly selectedMemberId = signal<number | null>(null);
  readonly selectedStatus = signal<RedemptionStatus | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly filtersExpanded = signal(true);

  readonly redemptions = signal<RedemptionHistoryResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedMemberId() !== null) count++;
    if (this.selectedStatus()) count++;
    if (this.dateFrom()) count++;
    if (this.dateTo()) count++;
    return count;
  });

  readonly filterSummary = computed(() => {
    const count = this.activeFilterCount();
    return count === 0
      ? 'Sin filtros'
      : `${count} filtro${count !== 1 ? 's' : ''} activo${count !== 1 ? 's' : ''}`;
  });

  constructor() {
    effect(() => {
      const familyId = this.familyId();
      if (!familyId) return;

      this.loadMembers(familyId);
      this.loadHistory(familyId);
    });
  }

  private loadMembers(familyId: number): void {
    this.membersService.getMembers(familyId).subscribe({
      next: (response) => this.members.set(response.members),
      error: () => {},
    });
  }

  private loadHistory(familyId: number): void {
    this.isLoading.set(true);
    this.error.set('');

    const status = this.selectedStatus();

    this.redemptionHistoryService.getHistory({
      familyId,
      memberId: this.selectedMemberId() ?? undefined,
      status: status || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
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
    const familyId = this.familyId();
    if (!familyId) return;

    this.closeFiltersIfNeeded();
    this.loadHistory(familyId);
  }

  clearFilters(): void {
    this.selectedMemberId.set(null);
    this.selectedStatus.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.closeFiltersIfNeeded();
    this.applyFilters();
  }

  toggleFilters(): void {
    if (!this.collapsibleFilters()) return;
    this.filtersExpanded.update(value => !value);
  }

  statusLabel(status: RedemptionStatus): string {
    return status === 'PENDING' ? 'Pendiente' : 'Entregado';
  }

  private closeFiltersIfNeeded(): void {
    if (this.collapsibleFilters()) {
      this.filtersExpanded.set(false);
    }
  }
}
