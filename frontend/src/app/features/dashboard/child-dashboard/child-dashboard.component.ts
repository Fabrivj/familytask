import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { TaskService } from '@core/services/task.service';
import { BadgeService } from '@core/services/badge.service';
import { RewardService } from '@core/services/reward.service';
import { MembersService } from '@core/services/members.service';
import { RedemptionService } from '@core/services/redemption.service';
import { HabitService } from '@core/services/habit.service';
import { injectLoadingState } from '@core/utils/loading-state';
import { notifyEarnedBadges } from '@core/utils/badge-notify';
import { formatDate } from '@core/utils/date-helpers';
import { statusLabel, statusIcon } from '@core/utils/task-labels';
import { TaskStatus } from '@core/models/task.model';
import { TaskResponse } from '@core/models/task.model';
import { BadgeResponse } from '@core/models/badge.model';
import { RewardResponse } from '@core/models/reward.model';
import { MemberItem } from '@core/models/member.model';
import { HabitResponse } from '@core/models/habit.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-child-dashboard',
  imports: [LowerCasePipe, RouterLink, MatIconModule, MatProgressSpinnerModule, ConfirmDialogComponent],
  templateUrl: './child-dashboard.component.html',
  styleUrl: './child-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly badgeService = inject(BadgeService);
  private readonly rewardService = inject(RewardService);
  private readonly membersService = inject(MembersService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly habitService = inject(HabitService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;

  readonly dashboardError = signal<string | null>(null);
  readonly myStats = signal<MemberItem | null>(null);
  readonly allTasks = signal<TaskResponse[]>([]);
  readonly allHabits = signal<HabitResponse[]>([]);
  readonly allBadges = signal<BadgeResponse[]>([]);
  readonly allRewards = signal<RewardResponse[]>([]);

  // ─── Action state ─────────────────────────────────────────────────────────
  readonly updatingTaskId = signal<number | null>(null);
  readonly completingHabitId = signal<number | null>(null);
  readonly rewardToClaim = signal<RewardResponse | null>(null);
  readonly showClaimDialog = signal(false);
  readonly isRedeeming = signal(false);

  // ─── Current user id ──────────────────────────────────────────────────────
  private readonly userId = computed(() => this.authService.currentUserId());

  // ─── XP progress ──────────────────────────────────────────────────────────
  readonly xpNeededInLevel = computed(() =>
    100 * ((this.myStats()?.currentLevel ?? 0) + 1)
  );
  readonly xpInLevel = computed(() =>
    this.xpNeededInLevel() - (this.myStats()?.xpToNextLevel ?? 0)
  );
  readonly progressPercent = computed(() =>
    Math.min(100, Math.max(0, (this.xpInLevel() / this.xpNeededInLevel()) * 100))
  );

  // ─── Tasks ────────────────────────────────────────────────────────────────
  readonly myPendingTasks = computed(() => {
    const userId = this.userId();
    return this.allTasks().filter(
      t => t.assignedToId === userId && t.status !== 'COMPLETED'
    );
  });

  readonly myCompletedTaskCount = computed(() => {
    const userId = this.userId();
    return this.allTasks().filter(
      t => t.assignedToId === userId && t.status === 'COMPLETED'
    ).length;
  });

  // ─── Habits ───────────────────────────────────────────────────────────────
  readonly myHabits = computed(() => {
    const userId = this.userId();
    return this.allHabits().filter(h => h.assignedToId === userId);
  });

  readonly pendingHabits = computed(() =>
    this.myHabits().filter(h => !h.completedInCurrentPeriod)
  );

  // ─── Badges ───────────────────────────────────────────────────────────────
  readonly earnedBadges = computed(() =>
    this.allBadges()
      .filter(b => b.earned)
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
      .slice(0, 8)
  );

  readonly lockedBadgesPreview = computed(() =>
    this.allBadges()
      .filter(b => !b.earned)
      .sort((a, b) => {
        const pA = a.conditionValue > 0 ? a.currentProgress / a.conditionValue : 0;
        const pB = b.conditionValue > 0 ? b.currentProgress / b.conditionValue : 0;
        return pB - pA;
      })
      .slice(0, 4)
  );

  // ─── Rewards ──────────────────────────────────────────────────────────────
  readonly availableRewards = computed(() => {
    const coins = this.myStats()?.totalCoins ?? 0;
    const level = this.myStats()?.currentLevel ?? 1;
    return this.allRewards()
      .filter(r => coins >= r.cost && (!r.minLevel || level >= r.minLevel))
      .slice(0, 3);
  });

  readonly lockedRewards = computed(() => {
    const coins = this.myStats()?.totalCoins ?? 0;
    const level = this.myStats()?.currentLevel ?? 1;
    return this.allRewards()
      .filter(r => coins < r.cost || (!!r.minLevel && level < r.minLevel))
      .slice(0, 2);
  });

  // ─── Summary totals ───────────────────────────────────────────────────────
  readonly totalPending = computed(() =>
    this.myPendingTasks().length + this.pendingHabits().length
  );

  readonly bonusXp = computed(() => {
    const taskXp = this.myPendingTasks().reduce((sum, t) => sum + t.xpReward, 0);
    const habitXp = this.pendingHabits().reduce((sum, h) => sum + h.xpReward, 0);
    return taskXp + habitXp;
  });

  readonly bonusCoins = computed(() => {
    const taskCoins = this.myPendingTasks().reduce((sum, t) => sum + t.coinsReward, 0);
    const habitCoins = this.pendingHabits().reduce((sum, h) => sum + h.coinsReward, 0);
    return taskCoins + habitCoins;
  });

  // ─── Empty / date helpers ─────────────────────────────────────────────────
  readonly hasNoMissions = computed(() =>
    !this.isLoading() &&
    !this.dashboardError() &&
    this.myPendingTasks().length === 0 &&
    this.myHabits().length === 0
  );

  readonly todayLabel = computed(() =>
    new Date().toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  );

  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) {
      this.dashboardError.set('No se pudo cargar tu dashboard. Intenta de nuevo.');
      return;
    }
    this.dashboardError.set(null);

    this.ls.run(
      forkJoin({
        stats:   this.membersService.getMyStats(familyId),
        tasks:   this.taskService.getTasks(familyId),
        habits:  this.habitService.getHabits(familyId),
        badges:  this.badgeService.getBadges(familyId),
        rewards: this.rewardService.getRewards(familyId),
      }),
      {
        next: ({ stats, tasks, habits, badges, rewards }) => {
          this.myStats.set(stats);
          this.allTasks.set(tasks);
          this.allHabits.set(habits);
          this.allBadges.set(badges);
          this.allRewards.set(rewards);
        },
        error: () => {
          this.dashboardError.set('No se pudo cargar tu dashboard. Intenta de nuevo.');
        },
      }
    );
  }

  // ─── Shared label/icon utilities (same as tasks-list) ────────────────────
  readonly statusLabel = statusLabel;
  readonly statusIcon = statusIcon;

  // ─── Child-only available transitions ────────────────────────────────────
  // IN_REVIEW is locked for the child — only a parent can act on it.
  availableNextStatuses(task: TaskResponse): TaskStatus[] {
    const s = task.status;
    if (s === 'PENDING') return ['IN_PROGRESS'];
    if (s === 'IN_PROGRESS') return ['IN_REVIEW'];
    return [];
  }

  // ─── Task actions ─────────────────────────────────────────────────────────
  doTaskAction(task: TaskResponse, newStatus: TaskStatus): void {
    if (this.updatingTaskId() !== null) return;
    this.updatingTaskId.set(task.id);

    const msgs: Record<TaskStatus, string> = {
      IN_PROGRESS: '¡Tarea iniciada!',
      IN_REVIEW:   '¡Tarea enviada para revisión!',
      PENDING:     'Tarea marcada como pendiente.',
      COMPLETED:   '¡Tarea completada!',
    };

    this.taskService.updateStatus(task.id, newStatus).subscribe({
      next: (updated) => {
        this.allTasks.update(list => list.map(t => t.id === task.id ? updated : t));
        this.updatingTaskId.set(null);
        this.snackBar.open(msgs[newStatus] ?? 'Tarea actualizada.', 'Cerrar',
          { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.updatingTaskId.set(null);
        this.snackBar.open(
          err.error?.message ?? 'No se pudo actualizar la tarea.',
          'Cerrar', { duration: 4000, panelClass: 'snack-error' }
        );
      },
    });
  }

  // ─── Habit actions ────────────────────────────────────────────────────────
  completeHabit(habit: HabitResponse): void {
    if (this.completingHabitId() !== null) return;
    this.completingHabitId.set(habit.id);

    this.habitService.complete(habit.id).subscribe({
      next: (result) => {
        this.allHabits.update(list =>
          list.map(h =>
            h.id === habit.id
              ? { ...h, completedInCurrentPeriod: true, currentStreak: result.currentStreak, longestStreak: result.longestStreak }
              : h
          )
        );
        this.myStats.update(s => s ? {
          ...s,
          totalXp:      result.newTotalXp,
          currentLevel: result.newLevel,
          totalCoins:   result.newTotalCoins,
          xpToNextLevel: result.xpToNextLevel,
        } : s);
        this.completingHabitId.set(null);

        const streakPart = result.currentStreak > 1
          ? ` · Racha ${result.currentStreak} días 🔥` : '';
        const msg = result.leveledUp
          ? `+${result.xpActuallyAwarded} XP · ¡Nivel ${result.newLevel}!${streakPart}`
          : `+${result.xpActuallyAwarded} XP · +${result.coinsActuallyAwarded} monedas${streakPart}`;
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: 'snack-success' });
        notifyEarnedBadges(this.snackBar, result.earnedBadges);
      },
      error: (err) => {
        this.completingHabitId.set(null);
        this.snackBar.open(
          err.error?.message ?? 'No se pudo completar el hábito.',
          'Cerrar', { duration: 4000, panelClass: 'snack-error' }
        );
      },
    });
  }

  // ─── Reward redemption ────────────────────────────────────────────────────
  openClaimDialog(reward: RewardResponse): void {
    this.rewardToClaim.set(reward);
    this.showClaimDialog.set(true);
  }

  closeClaimDialog(): void {
    this.showClaimDialog.set(false);
    this.rewardToClaim.set(null);
  }

  confirmClaim(): void {
    const reward = this.rewardToClaim();
    const familyId = this.authService.getActiveFamilyId();
    if (!reward || !familyId) return;
    this.closeClaimDialog();
    this.isRedeeming.set(true);

    this.redemptionService.requestRedemption({ rewardId: reward.id, familyId }).subscribe({
      next: () => {
        this.isRedeeming.set(false);
        this.myStats.update(s => s ? { ...s, totalCoins: (s.totalCoins ?? 0) - reward.cost } : s);
        this.snackBar.open('¡Canje solicitado! Pendiente de entrega.', 'Cerrar',
          { duration: 5000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.isRedeeming.set(false);
        this.snackBar.open(
          err.error?.message ?? 'No se pudo procesar el canje.',
          'Cerrar', { duration: 5000, panelClass: 'snack-error' }
        );
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  habitFrequencyLabel(freq: string): string {
    const map: Record<string, string> = {
      DAILY:    'Diario',
      WEEKLY:   'Semanal',
      WEEKDAYS: 'Días hábiles',
      WEEKENDS: 'Fines de semana',
      MONTHLY:  'Mensual',
    };
    return map[freq] ?? freq;
  }

  getProgressPercent(badge: BadgeResponse): number {
    if (badge.conditionValue <= 0) return 0;
    return Math.min(100, (badge.currentProgress / badge.conditionValue) * 100);
  }

  rewardBlockReason(reward: RewardResponse): string | null {
    const coins = this.myStats()?.totalCoins ?? 0;
    const level = this.myStats()?.currentLevel ?? 1;
    const noCoins = coins < reward.cost;
    const noLevel = !!reward.minLevel && level < reward.minLevel;
    if (noCoins && noLevel) return `◈ ${reward.cost} · Nivel ${reward.minLevel}`;
    if (noCoins) return `Necesitas ◈ ${reward.cost}`;
    if (noLevel) return `Requiere Nivel ${reward.minLevel}`;
    return null;
  }
}
