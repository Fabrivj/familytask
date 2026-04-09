import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { A11yModule } from '@angular/cdk/a11y';
import { AuthService } from '../../core/services/auth.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { RewardService } from '../../core/services/reward.service';
import { RewardResponse } from '../../core/models/reward.model';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const REWARD_ICONS = [
  'card_giftcard', 'local_pizza', 'sports_esports', 'movie',
  'icecream', 'flight', 'checkroom', 'celebration',
  'attractions', 'cake', 'emoji_events', 'music_note',
];

const ICON_LABELS: Record<string, string> = {
  card_giftcard: 'Regalo',
  local_pizza: 'Pizza',
  sports_esports: 'Videojuegos',
  movie: 'Película',
  icecream: 'Helado',
  flight: 'Viaje',
  checkroom: 'Ropa',
  celebration: 'Celebración',
  attractions: 'Parque de atracciones',
  cake: 'Pastel',
  emoji_events: 'Trofeo',
  music_note: 'Música',
};

@Component({
  selector: 'app-store',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, AppShellComponent, A11yModule, ConfirmDialogComponent],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreComponent {
  private readonly authService = inject(AuthService);
  private readonly rewardService = inject(RewardService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);

  @ViewChild('newRewardBtn') newRewardBtn!: ElementRef<HTMLButtonElement>;

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  readonly availableIcons = REWARD_ICONS;
  readonly iconLabels = ICON_LABELS;

  readonly rewards     = signal<RewardResponse[]>([]);
  readonly isLoading   = signal(false);
  readonly error       = signal('');

  readonly showCreatePanel = signal(false);
  readonly isCreating      = signal(false);
  readonly createError     = signal('');
  readonly editingReward   = signal<RewardResponse | null>(null);
  readonly isEditMode      = computed(() => this.editingReward() !== null);
  readonly selectedIcon    = signal<string>('card_giftcard');

  readonly showDeleteModal = signal(false);
  readonly rewardToDelete  = signal<RewardResponse | null>(null);

  readonly nameCtrl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(60),
    ],
  });
  readonly descriptionCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });
  readonly costCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  readonly minLevelCtrl = new FormControl<number | null>(null, {
    validators: [Validators.min(1), Validators.pattern(/^\d+$/)],
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

    this.rewardService.getRewards(familyId).subscribe({
      next: (rewards) => {
        this.rewards.set(rewards);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar las recompensas. Por favor, intente nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  getNameError(): string {
    const c = this.nameCtrl;
    if (c.hasError('required')) return 'El nombre de la recompensa es obligatorio.';
    if (c.hasError('minlength') || c.hasError('maxlength')) return 'El nombre debe tener entre 3 y 60 caracteres.';
    return '';
  }

  getDescriptionError(): string {
    if (this.descriptionCtrl.hasError('maxlength')) return 'Máximo 500 caracteres.';
    return '';
  }

  getCostError(): string {
    const c = this.costCtrl;
    if (c.hasError('required')) return 'El costo debe ser mayor a 0.';
    if (c.hasError('pattern') || c.hasError('min')) return 'El costo debe ser mayor a 0.';
    return '';
  }

  getMinLevelError(): string {
    const c = this.minLevelCtrl;
    if (c.hasError('pattern') || c.hasError('min')) return 'El nivel debe ser un número mayor a 0.';
    return '';
  }

  openCreatePanel(): void {
    this.resetForm();
    this.showCreatePanel.set(true);
  }

  openEditPanel(reward: RewardResponse): void {
    this.resetForm();
    this.editingReward.set(reward);
    this.nameCtrl.setValue(reward.name);
    this.descriptionCtrl.setValue(reward.description ?? '');
    this.costCtrl.setValue(reward.cost);
    this.minLevelCtrl.setValue(reward.minLevel ?? null);
    this.selectedIcon.set(reward.icon ?? 'card_giftcard');
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
    this.editingReward.set(null);
    setTimeout(() => this.newRewardBtn?.nativeElement?.focus());
  }

  selectIcon(icon: string): void {
    this.selectedIcon.set(icon);
  }

  /** Roving tabindex: arrow keys move focus within the icon radio group. */
  onIconKeydown(event: KeyboardEvent): void {
    const buttons = (event.currentTarget as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('button[data-icon-index]');
    const current = event.target as HTMLButtonElement;
    const idx = parseInt(current.dataset['iconIndex'] ?? '0', 10);

    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (idx + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (idx - 1 + buttons.length) % buttons.length;
    } else {
      return;
    }

    event.preventDefault();
    const target = buttons[next];
    this.selectIcon(target.querySelector('mat-icon')?.textContent?.trim() ?? '');
    target.focus();
  }

  openDeleteModal(reward: RewardResponse): void {
    this.rewardToDelete.set(reward);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.rewardToDelete.set(null);
  }

  confirmDelete(): void {
    const reward = this.rewardToDelete();
    if (!reward) return;

    this.rewardService.delete(reward.id).subscribe({
      next: () => {
        this.rewards.update(list => list.filter(r => r.id !== reward.id));
        this.closeDeleteModal();
        this.snackBar.open('Recompensa eliminada exitosamente.', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
      },
      error: (err) => {
        this.closeDeleteModal();
        this.snackBar.open(
          err.error?.message || 'No se pudo completar la operación. Intenta de nuevo.',
          'Cerrar',
          { duration: 5000, panelClass: 'snack-error' },
        );
      },
    });
  }

  submitCreate(): void {
    [this.nameCtrl, this.costCtrl, this.descriptionCtrl, this.minLevelCtrl]
      .forEach(c => c.markAllAsTouched());

    if (this.nameCtrl.invalid || this.costCtrl.invalid || this.descriptionCtrl.invalid || this.minLevelCtrl.invalid) return;

    const familyId = this.familyId();
    if (!familyId) return;

    this.isCreating.set(true);
    this.createError.set('');

    const editing = this.editingReward();

    const request$ = editing
      ? this.rewardService.update(editing.id, {
          name:        this.nameCtrl.value.trim(),
          description: this.descriptionCtrl.value.trim() || null,
          icon:        this.selectedIcon(),
          cost:        this.costCtrl.value!,
          minLevel:    this.minLevelCtrl.value ?? null,
        })
      : this.rewardService.create({
          familyId,
          name:        this.nameCtrl.value.trim(),
          description: this.descriptionCtrl.value.trim() || null,
          icon:        this.selectedIcon(),
          cost:        this.costCtrl.value!,
          minLevel:    this.minLevelCtrl.value ?? null,
        });

    const successMsg  = editing ? 'Recompensa actualizada exitosamente.' : 'Recompensa creada exitosamente.';
    const fallbackErr = editing
      ? 'No se pudo completar la operación. Intenta de nuevo.'
      : 'No se pudo crear la recompensa. Intenta de nuevo.';

    request$.subscribe({
      next: (saved) => {
        this.isCreating.set(false);
        this.closeCreatePanel();
        this.rewards.update(list =>
          editing ? list.map(r => r.id === saved.id ? saved : r) : [saved, ...list]
        );
        this.snackBar.open(successMsg, 'Cerrar', { duration: 4000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.createError.set(err.error?.message || fallbackErr);
        this.isCreating.set(false);
      },
    });
  }

  private resetForm(): void {
    this.editingReward.set(null);
    this.nameCtrl.reset('');
    this.descriptionCtrl.reset('');
    this.costCtrl.reset(null);
    this.minLevelCtrl.reset(null);
    this.selectedIcon.set('card_giftcard');
    this.createError.set('');
  }
}
