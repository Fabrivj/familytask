import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { HabitService } from '../../../core/services/habit.service';
import { HabitFrequency, HabitResponse } from '../../../core/models/habit.model';

@Component({
  selector: 'app-habits-list',
  imports: [LowerCasePipe, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
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
  readonly habits        = signal<HabitResponse[]>([]);
  readonly isLoading     = signal(false);
  readonly error         = signal('');

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
  }

  private loadData(familyId: number): void {
    this.isLoading.set(true);
    this.error.set('');

    this.habitService.getHabits(familyId).subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar los hábitos. Por favor, intente nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

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
