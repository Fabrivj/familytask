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
import { RedemptionService } from '../../core/services/redemption.service';
import { MembersService } from '../../core/services/members.service';
import { RewardResponse } from '../../core/models/reward.model';
import { MemberItem } from '../../core/models/member.model';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const REWARD_ICONS = [
  '🎁', '🍕', '🎮', '🎬',
  '🍦', '✈️', '👗', '🎉',
  '🎡', '🎂', '🏆', '🎵',
  '🍔', '⚽', '📚', '🎨',
  '🏖️', '🏊', '💵',
];

const ICON_LABELS: Record<string, string> = {
  '🎁': 'Regalo',
  '🍕': 'Pizza',
  '🎮': 'Videojuegos',
  '🎬': 'Película',
  '🍦': 'Helado',
  '✈️': 'Viaje',
  '👗': 'Ropa',
  '🎉': 'Celebración',
  '🎡': 'Parque de atracciones',
  '🎂': 'Pastel',
  '🏆': 'Trofeo',
  '🎵': 'Música',
  '🍔': 'Hamburguesa',
  '⚽': 'Deporte',
  '📚': 'Libros',
  '🎨': 'Arte',
  '🏖️': 'Playa',
  '🏊': 'Piscina',
  '💵': 'Billetes',
};

@Component({
  selector: 'app-store',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, AppShellComponent, A11yModule, PageHeaderComponent, ConfirmDialogComponent],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreComponent {
  private readonly authService = inject(AuthService);
  private readonly rewardService = inject(RewardService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly membersService = inject(MembersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);

  @ViewChild('newRewardBtn') newRewardBtn!: ElementRef<HTMLButtonElement>;

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  readonly availableIcons = REWARD_ICONS;
  readonly iconLabels = ICON_LABELS;

  readonly rewards     = signal<RewardResponse[]>([]);
  readonly rewardsSubtitle = computed(() => {
    const n = this.rewards().length;
    return `${n} recompensa${n !== 1 ? 's' : ''} activa${n !== 1 ? 's' : ''}`;
  });

  /** Average minLevel of rewards that have one set. */
  private readonly avgLevel = computed(() => {
    const leveled = this.rewards().filter(r => r.minLevel != null);
    if (!leveled.length) return 0;
    return leveled.reduce((sum, r) => sum + r.minLevel!, 0) / leveled.length;
  });

  /** Returns true if this reward's level is above the group average. */
  isPremium(reward: RewardResponse): boolean {
    return !!reward.minLevel && reward.minLevel > this.avgLevel();
  }

  /** Returns an array of length = minLevel (capped at 10) for star rendering. */
  starsArray(minLevel: number): number[] {
    return Array.from({ length: Math.min(minLevel, 10) });
  }

  readonly isLoading   = signal(false);
  readonly error       = signal('');

  readonly showCreatePanel = signal(false);
  readonly isCreating      = signal(false);
  readonly createError     = signal('');
  readonly editingReward   = signal<RewardResponse | null>(null);
  readonly isEditMode      = computed(() => this.editingReward() !== null);
  readonly selectedIcon    = signal<string>('🎁');

  readonly showDeleteModal = signal(false);
  readonly rewardToDelete  = signal<RewardResponse | null>(null);

  // ── Child stats & redemptions ──────────────────────────────────────────
  readonly myStats         = signal<MemberItem | null>(null);
  readonly isRedeeming     = signal(false);
  readonly rewardToClaim   = signal<RewardResponse | null>(null);
  readonly showClaimDialog = signal(false);

  /** True when the child has enough coins for the given reward. */
  canAfford(reward: RewardResponse): boolean {
    const coins = this.myStats()?.totalCoins ?? 0;
    return coins >= reward.cost;
  }

  /** True when the child meets the level requirement (or there is none). */
  meetsLevel(reward: RewardResponse): boolean {
    if (!reward.minLevel) return true;
    return (this.myStats()?.currentLevel ?? 1) >= reward.minLevel;
  }

  /**
   * Returns the tooltip text explaining why the claim button is locked,
   * or null when the child can freely claim.
   */
  claimBlockReason(reward: RewardResponse): string | null {
    const noCoins = !this.canAfford(reward);
    const noLevel = !this.meetsLevel(reward);
    if (noCoins && noLevel) return 'No tienes monedas suficientes y no alcanzas el nivel mínimo requerido para esta recompensa.';
    if (noCoins) return 'No tienes monedas suficientes para canjear esta recompensa.';
    if (noLevel) return 'No alcanzas el nivel mínimo requerido para esta recompensa.';
    return null;
  }

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

    if (!this.isParent()) {
      this.membersService.getMyStats(familyId).subscribe({
        next: (stats) => this.myStats.set(stats),
        error: () => {},
      });
    }
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
    this.selectedIcon.set(reward.icon ?? '🎁');
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
    this.editingReward.set(null);
    setTimeout(() => this.newRewardBtn?.nativeElement?.focus());
  }

  cardGradient(icon: string | null): string {
    const warm = new Set(['🍕', '🍦', '🎂', '🍔']);
    const cool = new Set(['🎮', '🎬', '🎡', '⚽', '📚', '🏖️', '🏊']);
    const gold = new Set(['🏆', '🎉', '🎁', '✈️', '💵']);
    const i = icon ?? '';
    if (warm.has(i)) return 'linear-gradient(145deg, rgba(255,100,50,0.10) 0%, rgba(255,180,30,0.07) 100%)';
    if (cool.has(i)) return 'linear-gradient(145deg, rgba(60,100,255,0.10) 0%, rgba(120,60,255,0.07) 100%)';
    if (gold.has(i)) return 'linear-gradient(145deg, rgba(255,200,30,0.10) 0%, rgba(255,140,30,0.07) 100%)';
    return 'linear-gradient(145deg, rgba(var(--primary-rgb),0.09) 0%, rgba(var(--primary-rgb),0.03) 100%)';
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
    this.selectIcon(target.querySelector('span')?.textContent?.trim() ?? '');
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

  // ── Redemption (child flow) ────────────────────────────────────────────

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
    const familyId = this.familyId();
    if (!reward || !familyId) return;

    this.closeClaimDialog();
    this.isRedeeming.set(true);

    this.redemptionService.requestRedemption({ rewardId: reward.id, familyId }).subscribe({
      next: () => {
        this.isRedeeming.set(false);
        this.myStats.update(s => s ? { ...s, totalCoins: (s.totalCoins ?? 0) - reward.cost } : s);
        this.snackBar.open(
          'Canje solicitado exitosamente. Queda pendiente de entrega.',
          'Cerrar',
          { duration: 5000, panelClass: 'snack-success' },
        );
      },
      error: (err) => {
        this.isRedeeming.set(false);
        this.snackBar.open(
          err.error?.message || 'No se pudo procesar el canje. Intenta de nuevo.',
          'Cerrar',
          { duration: 5000, panelClass: 'snack-error' },
        );
      },
    });
  }

  private resetForm(): void {
    this.editingReward.set(null);
    this.nameCtrl.reset('');
    this.descriptionCtrl.reset('');
    this.costCtrl.reset(null);
    this.minLevelCtrl.reset(null);
    this.selectedIcon.set('🎁');
    this.createError.set('');
  }
}
