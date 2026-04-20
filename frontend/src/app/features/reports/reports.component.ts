import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';
import { ReportService } from '@core/services/report.service';
import { MembersService } from '@core/services/members.service';
import { SpaceService } from '@core/services/space.service';
import { WeeklyReportResponse, MemberWeeklyStats } from '@core/models/report.model';
import { MemberItem } from '@core/models/member.model';
import { SpaceResponse } from '@core/models/space.model';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { toIsoDate } from '@core/utils/date-helpers';

@Component({
  selector: 'app-reports',
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
    PageHeaderComponent,
    UserAvatarComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private readonly authService  = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly membersService = inject(MembersService);
  private readonly spaceService = inject(SpaceService);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);

  // ── Filtros ───────────────────────────────────────────────────────────────
  readonly selectedWeekStart = signal<string>(this.currentMonday());
  readonly selectedMemberId  = signal<number | null>(null);
  readonly selectedSpaceId   = signal<number | null>(null);

  // ── Datos auxiliares para filtros ─────────────────────────────────────────
  readonly members = signal<MemberItem[]>([]);
  readonly spaces  = signal<SpaceResponse[]>([]);

  // ── Estado del reporte ────────────────────────────────────────────────────
  readonly report    = signal<WeeklyReportResponse | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal('');

  readonly isEmpty = computed(() => {
    const r = this.report();
    if (!r) return false;
    return r.tasksCompleted === 0 && r.tasksPending === 0 &&
           r.tasksInProgress === 0 && r.tasksInReview === 0 &&
           r.habitsCompleted === 0;
  });

  ngOnInit(): void {
    const id = this.familyId();
    if (!id) return;

    this.membersService.getMembers(id).subscribe({
      next: (res) => this.members.set(res.members),
      error: () => {},
    });
    this.spaceService.getSpaces(id).subscribe({
      next: (spaces) => this.spaces.set(spaces),
      error: () => {},
    });

    this.loadReport();
  }

  loadReport(): void {
    const familyId = this.familyId();
    if (!familyId) return;

    this.isLoading.set(true);
    this.error.set('');

    this.reportService.getWeeklyReport({
      familyId,
      weekStart: this.selectedWeekStart(),
      memberId:  this.selectedMemberId(),
      spaceId:   this.selectedSpaceId(),
    }).subscribe({
      next: (r) => {
        this.report.set(r);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'No se pudo generar el reporte. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  selectMember(id: number | null): void {
    this.selectedMemberId.set(id);
    this.loadReport();
  }

  selectSpace(id: number | null): void {
    this.selectedSpaceId.set(id);
    this.loadReport();
  }

  onWeekChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      this.selectedWeekStart.set(val);
      this.loadReport();
    }
  }

  prevWeek(): void {
    const d = new Date(this.selectedWeekStart() + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    this.selectedWeekStart.set(toIsoDate(d));
    this.loadReport();
  }

  nextWeek(): void {
    const d = new Date(this.selectedWeekStart() + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    this.selectedWeekStart.set(toIsoDate(d));
    this.loadReport();
  }

  weekLabel(): string {
    const start = new Date(this.selectedWeekStart() + 'T00:00:00');
    const end   = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    return `${fmt(start)} – ${fmt(end)}`;
  }

  barWidth(value: number, max: number): number {
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  maxDailyValue(): number {
    const r = this.report();
    if (!r) return 1;
    return Math.max(1, ...r.dailyTrend.map(d => d.tasksCompleted + d.habitsCompleted));
  }

  dayLabel(iso: string): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[new Date(iso + 'T00:00:00').getDay()];
  }

  memberShortName(name: string): string {
    const parts = name.trim().split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  }

  trackByMember(_: number, m: MemberWeeklyStats): number { return m.memberId; }

  private currentMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toIsoDate(d);
  }
}
