import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { MembersService } from '@core/services/members.service';
import { TaskService } from '@core/services/task.service';
import { HabitService } from '@core/services/habit.service';
import { RedemptionHistoryService } from '@core/services/redemption-history.service';
import { MemberItem } from '@core/models/member.model';
import { TaskResponse } from '@core/models/task.model';
import { HabitResponse } from '@core/models/habit.model';
import { RedemptionHistoryResponse } from '@core/models/redemption.model';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

/**
 * Dashboard familiar para Padre/Tutor.
 * Muestra un resumen del grupo, las tareas por verificar, los canjes pendientes
 * y el progreso individual de cada hijo.
 *
 * Solo se monta desde DashboardComponent cuando activeFamily.role === 'PARENT'.
 */
@Component({
  selector: 'app-parent-dashboard',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule, UserAvatarComponent],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly membersService = inject(MembersService);
  private readonly taskService = inject(TaskService);
  private readonly habitService = inject(HabitService);
  private readonly redemptionHistoryService = inject(RedemptionHistoryService);
  private readonly snackBar = inject(MatSnackBar);

  /** Mensaje flash tras flujos como "crear familia" — se muestra como banner. */
  readonly successMessage = input<string | null>(null);

  // ─── Estado base (patrón "Patrón de carga de datos" de CLAUDE.md) ────────
  readonly members = signal<MemberItem[]>([]);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly habits = signal<HabitResponse[]>([]);
  readonly redemptions = signal<RedemptionHistoryResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  // ─── Sesión / saludo ─────────────────────────────────────────────────────
  readonly userName = computed(() => this.authService.session()?.name ?? '');

  // ─── Derivados: miembros ─────────────────────────────────────────────────
  readonly children = computed(() =>
    this.members().filter(m => m.role === 'CHILD'),
  );

  // ─── Derivados: resumen del grupo ────────────────────────────────────────
  readonly activeTasksCount = computed(() =>
    this.tasks().filter(t => t.status !== 'COMPLETED').length,
  );

  readonly activeHabitsCount = computed(() => this.habits().length);

  readonly coinsInCirculation = computed(() =>
    this.children().reduce((sum, m) => sum + (m.totalCoins ?? 0), 0),
  );

  readonly completedTasksTotal = computed(() =>
    this.children().reduce((sum, m) => sum + (m.completedTaskCount ?? 0), 0),
  );

  // ─── Derivados: tareas por verificar (enviadas por hijo a revisión) ─────
  readonly pendingVerificationTasks = computed(() =>
    this.tasks().filter(t => t.status === 'IN_REVIEW'),
  );

  // ─── Derivados: canjes ───────────────────────────────────────────────────
  /** Canjes aún sin entregar — alimentan el badge y la banner-sub. */
  readonly pendingRedemptionsCount = computed(
    () => this.redemptions().filter(r => r.status === 'PENDING').length,
  );

  /** Últimos 5 canjes (cualquier estado) ordenados por fecha desc. */
  readonly recentRedemptions = computed(() =>
    [...this.redemptions()]
      .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
      .slice(0, 5),
  );

  // ─── Helpers de presentación ─────────────────────────────────────────────
  /** % de XP dentro del nivel actual (misma fórmula que child-dashboard). */
  xpPercent(member: MemberItem): number {
    const level = member.currentLevel ?? 0;
    const xpToNext = member.xpToNextLevel ?? 0;
    const xpNeededInLevel = 100 * (level + 1);
    if (xpNeededInLevel <= 0) return 0;
    const xpInLevel = xpNeededInLevel - xpToNext;
    return Math.min(100, Math.max(0, (xpInLevel / xpNeededInLevel) * 100));
  }

  /** XP actual dentro del nivel (numerador para etiqueta "X/Y"). */
  xpInLevel(member: MemberItem): number {
    const level = member.currentLevel ?? 0;
    const xpToNext = member.xpToNextLevel ?? 0;
    return 100 * (level + 1) - xpToNext;
  }

  /** XP requerido para completar el nivel actual. */
  xpNeededInLevel(member: MemberItem): number {
    return 100 * ((member.currentLevel ?? 0) + 1);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) {
      this.error.set('Error al cargar el dashboard familiar. Intenta de nuevo.');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    forkJoin({
      members: this.membersService.getMembers(familyId),
      tasks: this.taskService.getTasks(familyId),
      habits: this.habitService.getHabits(familyId),
      redemptions: this.redemptionHistoryService.getHistory({ familyId }),
    }).subscribe({
      next: ({ members, tasks, habits, redemptions }) => {
        this.members.set(members.members);
        this.tasks.set(tasks);
        this.habits.set(habits);
        this.redemptions.set(redemptions);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el dashboard familiar. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  // ─── Acciones inline de verificación ─────────────────────────────────────
  /** Aprueba una tarea en revisión: la marca como completada. */
  approveTask(taskId: number): void {
    this.taskService.updateStatus(taskId, 'COMPLETED').subscribe({
      next: () => {
        this.snackBar.open('Tarea aprobada.', 'Cerrar', { duration: 4000 });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message ?? 'No se pudo aprobar la tarea.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  /** Rechaza una tarea en revisión: la regresa al hijo como "en progreso". */
  rejectTask(taskId: number): void {
    this.taskService.updateStatus(taskId, 'IN_PROGRESS').subscribe({
      next: () => {
        this.snackBar.open('Tarea devuelta al hijo.', 'Cerrar', { duration: 4000 });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message ?? 'No se pudo rechazar la tarea.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }
}
