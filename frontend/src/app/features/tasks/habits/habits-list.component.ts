import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { HabitService } from '../../../core/services/habit.service';
import { HabitFrequency, HabitResponse } from '../../../core/models/habit.model';

@Component({
  selector: 'app-habits-list',
  imports: [LowerCasePipe, ReactiveFormsModule, MatIconModule],
  templateUrl: './habits-list.component.html',
  styleUrl: './habits-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitsListComponent {
  private readonly authService = inject(AuthService);
  private readonly habitService = inject(HabitService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly habits = signal<HabitResponse[]>([]);

  // ─── Panel de creación ────────────────────────────────────────────────────
  readonly showCreatePanel = signal(false);
  readonly isCreating = signal(false);
  readonly createError = signal('');

  readonly titleCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(100)],
  });
  readonly descriptionCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });
  readonly selectedFrequency = signal<HabitFrequency>('DAILY');
  readonly xpRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  readonly coinsRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  // ─── Helpers ──────────────────────────────────────────────────────────────
  frequencyLabel(f: string): string {
    const labels: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      WEEKDAYS: 'Lunes a Viernes',
      WEEKENDS: 'Fines de Semana',
      MONTHLY: 'Mensual',
    };
    return labels[f] ?? f;
  }

  // ─── Validación del formulario ────────────────────────────────────────────
  getTitleError(): string {
    const c = this.titleCtrl;
    if (c.hasError('required')) return 'El campo Título es obligatorio.';
    if (c.hasError('maxlength')) return 'Máximo 100 caracteres.';
    return '';
  }

  getDescriptionError(): string {
    if (this.descriptionCtrl.hasError('maxlength')) return 'Máximo 500 caracteres.';
    return '';
  }

  getXpError(): string {
    if (this.xpRewardCtrl.hasError('required')) return 'Requerido.';
    if (this.xpRewardCtrl.hasError('pattern')) return 'Debe ser un número entero.';
    if (this.xpRewardCtrl.hasError('min')) return 'Mínimo 1.';
    return '';
  }

  getCoinsError(): string {
    if (this.coinsRewardCtrl.hasError('required')) return 'Requerido.';
    if (this.coinsRewardCtrl.hasError('pattern')) return 'Debe ser un número entero.';
    if (this.coinsRewardCtrl.hasError('min')) return 'Mínimo 1.';
    return '';
  }

  // ─── Panel de creación ────────────────────────────────────────────────────
  openCreatePanel(): void {
    this.resetForm();
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
  }

  selectFrequency(f: HabitFrequency): void {
    this.selectedFrequency.set(f);
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

    this.habitService.create({
      familyId,
      title: this.titleCtrl.value.trim(),
      description: this.descriptionCtrl.value.trim() || null,
      frequency: this.selectedFrequency(),
      xpReward: this.xpRewardCtrl.value!,
      coinsReward: this.coinsRewardCtrl.value!,
    }).subscribe({
      next: (habit) => {
        this.isCreating.set(false);
        this.closeCreatePanel();
        this.habits.update(list => [...list, habit]);
        this.snackBar.open('Hábito guardado correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
      },
      error: (err) => {
        this.createError.set(err.error?.message || 'Ocurrió un error al crear el hábito. Por favor, intente nuevamente.');
        this.isCreating.set(false);
      },
    });
  }

  private resetForm(): void {
    this.titleCtrl.reset('');
    this.descriptionCtrl.reset('');
    this.selectedFrequency.set('DAILY');
    this.xpRewardCtrl.reset(null);
    this.coinsRewardCtrl.reset(null);
    this.createError.set('');
  }
}
