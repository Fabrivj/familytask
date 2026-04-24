import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { notifyEarnedBadges } from '@core/utils/badge-notify';
import { PermissionsService } from '@core/services/permissions.service';
import { HabitService } from '@core/services/habit.service';
import { MembersService } from '@core/services/members.service';
import { CompleteHabitResponse, HabitFrequency, HabitResponse, UpdateHabitRequest } from '@core/models/habit.model';
import { HABIT_FREQUENCIES, frequencyIcon, frequencyLabel } from '@core/utils/habit-labels';
import { injectLoadingState } from '@core/utils/loading-state';
import { memberShortName } from '@core/utils/member-helpers';
import { createFocusRestore } from '@core/utils/focus-restore';
import { fieldError } from '@core/utils/form-errors';
import { MemberItem } from '@core/models/member.model';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-habits-list',
  imports: [A11yModule, LowerCasePipe, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, UserAvatarComponent, ConfirmDialogComponent],
  templateUrl: './habits-list.component.html',
  styleUrls: ['../shared/list-shared.css', './habits-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitsListComponent {
  private readonly authService = inject(AuthService);
  private readonly habitService = inject(HabitService);
  private readonly membersService = inject(MembersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;
  readonly currentUserId = computed(() => this.authService.currentUserId());

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly habits   = signal<HabitResponse[]>([]);
  readonly countChange = output<number>();
  readonly openPanelTrigger = input(0);

  readonly members  = signal<MemberItem[]>([]);
  readonly childMembers = computed(() => this.members().filter(m => m.role === 'CHILD'));

  // ─── Completar hábito ─────────────────────────────────────────────────────
  readonly isCompletingHabit = signal<number | null>(null);

  completeHabit(habit: HabitResponse): void {
    this.isCompletingHabit.set(habit.id);
    this.habitService.complete(habit.id).subscribe({
      next: (result: CompleteHabitResponse) => {
        this.habits.update(list => list.map(h =>
          h.id === habit.id
            ? { ...h, completedInCurrentPeriod: true, currentStreak: result.currentStreak, longestStreak: result.longestStreak }
            : h
        ));
        this.isCompletingHabit.set(null);

        const multiplierLabel = result.streakMultiplier > 1
          ? ` (×${result.streakMultiplier.toFixed(2)} racha)`
          : '';
        const rewardMsg = result.leveledUp
          ? `+${result.xpActuallyAwarded} XP · +${result.coinsActuallyAwarded} monedas${multiplierLabel} → ¡${result.assignedToName} subió al nivel ${result.newLevel}!`
          : `+${result.xpActuallyAwarded} XP · +${result.coinsActuallyAwarded} monedas${multiplierLabel}`;

        this.snackBar.open(
          `¡Hábito completado! ${rewardMsg} 🔥 Racha: ${result.currentStreak} día${result.currentStreak === 1 ? '' : 's'}`,
          'Cerrar',
          { duration: 6000, panelClass: 'snack-success' },
        );
        notifyEarnedBadges(this.snackBar, result.earnedBadges);
      },
      error: (err) => {
        this.isCompletingHabit.set(null);
        this.snackBar.open(
          err.error?.message || 'No se pudo registrar el hábito. Por favor, intente nuevamente.',
          'Cerrar',
          { duration: 5000, panelClass: 'snack-error' },
        );
      },
    });
  }

  // ─── Modal de borrado ─────────────────────────────────────────────────────
  readonly showDeleteModal = signal(false);
  readonly habitToDelete = signal<HabitResponse | null>(null);
  private readonly ls    = injectLoadingState();
  readonly isLoading     = this.ls.isLoading;
  readonly error         = this.ls.error;

  // ─── Filtros ───────────────────────────────────────────────────────────────
  readonly filterFrequency = signal<string | null>(null);
  readonly searchQuery     = signal('');

  readonly filteredHabits = computed(() => {
    const freq = this.filterFrequency();
    const q    = this.searchQuery().toLowerCase().trim();
    return this.habits().filter(h => {
      if (freq && h.frequency !== freq) return false;
      if (q && !h.title.toLowerCase().includes(q) &&
          !(h.description ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  });

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id) this.loadData(id);
    });
    effect(() => {
      const v = this.openPanelTrigger();
      if (v > 0) this.openCreatePanel();
    });
  }

  private loadData(familyId: number): void {
    this.ls.run(this.habitService.getHabits(familyId), {
      next: (habits) => {
        this.habits.set(habits);
        this.countChange.emit(habits.length);
      },
    });

    this.membersService.getMembers(familyId).subscribe({
      next: (res) => this.members.set(res.members),
      error: () => {},
    });
  }

  // ─── Panel de creación / edición ─────────────────────────────────────────
  readonly showCreatePanel = signal(false);
  readonly isCreating = signal(false);
  readonly createError = signal('');
  readonly editingHabit = signal<HabitResponse | null>(null);
  readonly isEditMode = computed(() => this.editingHabit() !== null);

  readonly titleCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(100)],
  });
  readonly descriptionCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });
  readonly selectedFrequency  = signal<HabitFrequency>('DAILY');
  readonly selectedAssignee   = signal<number | null>(null);
  readonly xpRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  readonly coinsRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  // ─── Helpers ──────────────────────────────────────────────────────────────
  readonly frequencies = HABIT_FREQUENCIES;
  readonly frequencyIcon = frequencyIcon;
  readonly frequencyLabel = frequencyLabel;

  readonly memberShortName = memberShortName;

  // ─── Validación del formulario ────────────────────────────────────────────
  getTitleError = () => fieldError(this.titleCtrl, { required: 'El campo Título es obligatorio.', maxlength: 'Máximo 100 caracteres.' });
  getDescriptionError = () => fieldError(this.descriptionCtrl, { maxlength: 'Máximo 500 caracteres.' });
  getXpError = () => fieldError(this.xpRewardCtrl, { required: 'Requerido.', pattern: 'Debe ser un número entero.', min: 'Mínimo 1.' });
  getCoinsError = () => fieldError(this.coinsRewardCtrl, { required: 'Requerido.', pattern: 'Debe ser un número entero.', min: 'Mínimo 1.' });

  // ─── Panel de creación ────────────────────────────────────────────────────
  private readonly _panelFocus = createFocusRestore();

  openCreatePanel(): void {
    this._panelFocus.save();
    this.resetForm();
    this.showCreatePanel.set(true);
  }

  openEditPanel(habit: HabitResponse): void {
    this._panelFocus.save();
    this.resetForm();
    this.editingHabit.set(habit);
    this.titleCtrl.setValue(habit.title);
    this.descriptionCtrl.setValue(habit.description ?? '');
    this.selectedFrequency.set(habit.frequency);
    this.xpRewardCtrl.setValue(habit.xpReward);
    this.coinsRewardCtrl.setValue(habit.coinsReward);
    this.selectedAssignee.set(habit.assignedToId);
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
    this.editingHabit.set(null);
    this._panelFocus.restore();
  }

  selectFrequency(f: HabitFrequency): void {
    this.selectedFrequency.set(f);
  }

  toggleFrequency(f: string): void {
    this.filterFrequency.update(cur => cur === f ? null : f);
  }

  submitCreate(): void {
    [this.titleCtrl, this.xpRewardCtrl, this.coinsRewardCtrl]
      .forEach(c => c.markAllAsTouched());
    this.descriptionCtrl.markAllAsTouched();

    if (
      this.titleCtrl.invalid ||
      this.descriptionCtrl.invalid ||
      this.xpRewardCtrl.invalid ||
      this.coinsRewardCtrl.invalid
    ) return;

    const familyId = this.familyId();
    if (!familyId) return;

    this.isCreating.set(true);
    this.createError.set('');

    const editing = this.editingHabit();
    const assignedToId = this.selectedAssignee();

    if (editing) {
      const request: UpdateHabitRequest = {
        familyId,
        title: this.titleCtrl.value.trim(),
        description: this.descriptionCtrl.value.trim() || null,
        frequency: this.selectedFrequency(),
        xpReward: this.xpRewardCtrl.value!,
        coinsReward: this.coinsRewardCtrl.value!,
        assignedToId,
      };
      this.habitService.update(editing.id, request).subscribe({
        next: (updated) => {
          this.habits.update(list => list.map(h => h.id === updated.id ? updated : h));
          this.isCreating.set(false);
          this.closeCreatePanel();
          this.snackBar.open('Hábito actualizado exitosamente', 'Cerrar', { duration: 4000, panelClass: 'snack-success' });
        },
        error: (err) => {
          this.createError.set(err.error?.message || 'Ocurrió un error al actualizar el hábito. Por favor, intente nuevamente.');
          this.isCreating.set(false);
        },
      });
      return;
    }

    this.habitService.create({
      familyId,
      title: this.titleCtrl.value.trim(),
      description: this.descriptionCtrl.value.trim() || null,
      frequency: this.selectedFrequency(),
      xpReward: this.xpRewardCtrl.value!,
      coinsReward: this.coinsRewardCtrl.value!,
    }).subscribe({
      next: (habit) => {
        if (assignedToId) {
          this.habitService.assign(habit.id, { familyId, assignedToId }).subscribe({
            next: (updated) => {
              this.isCreating.set(false);
              this.closeCreatePanel();
              this.habits.update(list => [...list, updated]);
              this.snackBar.open('Hábito creado y asignado correctamente', 'Cerrar', { duration: 4000, panelClass: 'snack-success' });
            },
            error: () => {
              this.isCreating.set(false);
              this.closeCreatePanel();
              this.habits.update(list => [...list, habit]);
              this.snackBar.open('Hábito creado, pero no se pudo asignar. Por favor, intente nuevamente.', 'Cerrar', { duration: 5000, panelClass: 'snack-error' });
            },
          });
        } else {
          this.isCreating.set(false);
          this.closeCreatePanel();
          this.habits.update(list => [...list, habit]);
          this.snackBar.open('Hábito guardado correctamente', 'Cerrar', { duration: 4000, panelClass: 'snack-success' });
        }
      },
      error: (err) => {
        this.createError.set(err.error?.message || 'Ocurrió un error al crear el hábito. Por favor, intente nuevamente.');
        this.isCreating.set(false);
      },
    });
  }

  // ─── Modal de borrado ─────────────────────────────────────────────────────
  private readonly _deleteFocus = createFocusRestore();

  openDeleteModal(habit: HabitResponse): void {
    this._deleteFocus.save();
    this.habitToDelete.set(habit);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.habitToDelete.set(null);
    this._deleteFocus.restore();
  }

  confirmDelete(): void {
    const habit = this.habitToDelete();
    if (!habit) return;
    this.habitService.delete(habit.id).subscribe({
      next: () => {
        this.habits.update(list => list.filter(h => h.id !== habit.id));
        this.closeDeleteModal();
        this.snackBar.open('Hábito eliminado correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
      },
      error: (err) => {
        this.closeDeleteModal();
        this.snackBar.open(
          err.error?.message || 'Ocurrió un error al eliminar el hábito. Por favor, intente nuevamente.',
          'Cerrar',
          { duration: 5000, panelClass: 'snack-error' },
        );
      },
    });
  }

  private resetForm(): void {
    this.editingHabit.set(null);
    this.titleCtrl.reset('');
    this.descriptionCtrl.reset('');
    this.selectedFrequency.set('DAILY');
    this.xpRewardCtrl.reset(null);
    this.coinsRewardCtrl.reset(null);
    this.selectedAssignee.set(null);
    this.createError.set('');
  }
}
