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
import { RedemptionHistoryPanelComponent } from '../../shared/components/redemption-history-panel/redemption-history-panel.component';
import { injectLoadingState } from '../../core/utils/loading-state';

const REWARD_ICONS = [
  '\u{1F381}', '\u{1F355}', '\u{1F3AE}', '\u{1F3AC}',
  '\u{1F366}', '\u{2708}\u{FE0F}', '\u{1F457}', '\u{1F389}',
  '\u{1F3A1}', '\u{1F382}', '\u{1F3C6}', '\u{1F3B5}',
  '\u{1F354}', '\u{26BD}', '\u{1F4DA}', '\u{1F3A8}',
  '\u{1F3D6}\u{FE0F}', '\u{1F3CA}', '\u{1F4B5}',
];

const ICON_LABELS: Record<string, string> = {
  '\u{1F381}': 'Regalo',
  '\u{1F355}': 'Pizza',
  '\u{1F3AE}': 'Videojuegos',
  '\u{1F3AC}': 'Pelicula',
  '\u{1F366}': 'Helado',
  '\u{2708}\u{FE0F}': 'Viaje',
  '\u{1F457}': 'Ropa',
  '\u{1F389}': 'Celebracion',
  '\u{1F3A1}': 'Parque de atracciones',
  '\u{1F382}': 'Pastel',
  '\u{1F3C6}': 'Trofeo',
  '\u{1F3B5}': 'Musica',
  '\u{1F354}': 'Hamburguesa',
  '\u{26BD}': 'Deporte',
  '\u{1F4DA}': 'Libros',
  '\u{1F3A8}': 'Arte',
  '\u{1F3D6}\u{FE0F}': 'Playa',
  '\u{1F3CA}': 'Piscina',
  '\u{1F4B5}': 'Billetes',
};

@Component({
  selector: 'app-store',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
    A11yModule,
    PageHeaderComponent,
    ConfirmDialogComponent,
    RedemptionHistoryPanelComponent,
  ],
  templateUrl: './store.component.html',
  styleUrls: ['../tasks/shared/list-shared.css', './store.component.css'],
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

  readonly rewards = signal<RewardResponse[]>([]);
  readonly activeTab = signal<'rewards' | 'history'>('rewards');
  readonly rewardsSubtitle = computed(() => {
    const n = this.rewards().length;
    return `${n} recompensa${n !== 1 ? 's' : ''} activa${n !== 1 ? 's' : ''}`;
  });

  private readonly avgLevel = computed(() => {
    const leveled = this.rewards().filter(r => r.minLevel != null);
    if (!leveled.length) return 0;
    return leveled.reduce((sum, r) => sum + r.minLevel!, 0) / leveled.length;
  });

  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;
  readonly error = this.ls.error;

  readonly showCreatePanel = signal(false);
  readonly isCreating = signal(false);
  readonly createError = signal('');
  readonly editingReward = signal<RewardResponse | null>(null);
  readonly isEditMode = computed(() => this.editingReward() !== null);
  readonly selectedIcon = signal<string>('\u{1F381}');

  readonly showDeleteModal = signal(false);
  readonly rewardToDelete = signal<RewardResponse | null>(null);

  readonly myStats = signal<MemberItem | null>(null);
  readonly isRedeeming = signal(false);
  readonly rewardToClaim = signal<RewardResponse | null>(null);
  readonly showClaimDialog = signal(false);

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

  /** Pre-computed per-reward derived values — evaluated once per data change, not per CD tick. */
  readonly rewardMeta = computed(() => {
    const avg = this.avgLevel();
    const coins = this.myStats()?.totalCoins ?? 0;
    const level = this.myStats()?.currentLevel ?? 1;
    const map = new Map<number, { premium: boolean; stars: number[]; gradient: string; blockReason: string | null }>();

    for (const r of this.rewards()) {
      const premium = !!r.minLevel && r.minLevel > avg;
      const stars: number[] = r.minLevel ? Array.from({ length: Math.min(r.minLevel, 10) }, (_, i) => i) : [];
      const gradient = this.cardGradient(r.icon);
      const noCoins = coins < r.cost;
      const noLevel = !!r.minLevel && level < r.minLevel;
      let blockReason: string | null = null;
      if (noCoins && noLevel) blockReason = 'No tienes monedas suficientes y no alcanzas el nivel minimo requerido para esta recompensa.';
      else if (noCoins) blockReason = 'No tienes monedas suficientes para canjear esta recompensa.';
      else if (noLevel) blockReason = 'No alcanzas el nivel minimo requerido para esta recompensa.';
      map.set(r.id, { premium, stars, gradient, blockReason });
    }
    return map;
  });

  private loadData(familyId: number): void {
    this.ls.run(this.rewardService.getRewards(familyId), {
      next: (rewards) => this.rewards.set(rewards),
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
    if (this.descriptionCtrl.hasError('maxlength')) return 'Maximo 500 caracteres.';
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
    if (c.hasError('pattern') || c.hasError('min')) return 'El nivel debe ser un numero mayor a 0.';
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
    this.selectedIcon.set(reward.icon ?? '\u{1F381}');
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
    this.editingReward.set(null);
    setTimeout(() => this.newRewardBtn?.nativeElement?.focus());
  }

  cardGradient(icon: string | null): string {
    const warm = new Set(['\u{1F355}', '\u{1F366}', '\u{1F382}', '\u{1F354}']);
    const cool = new Set(['\u{1F3AE}', '\u{1F3AC}', '\u{1F3A1}', '\u{26BD}', '\u{1F4DA}', '\u{1F3D6}\u{FE0F}', '\u{1F3CA}']);
    const gold = new Set(['\u{1F3C6}', '\u{1F389}', '\u{1F381}', '\u{2708}\u{FE0F}', '\u{1F4B5}']);
    const i = icon ?? '';
    if (warm.has(i)) return 'linear-gradient(145deg, rgba(255,100,50,0.10) 0%, rgba(255,180,30,0.07) 100%)';
    if (cool.has(i)) return 'linear-gradient(145deg, rgba(60,100,255,0.10) 0%, rgba(120,60,255,0.07) 100%)';
    if (gold.has(i)) return 'linear-gradient(145deg, rgba(255,200,30,0.10) 0%, rgba(255,140,30,0.07) 100%)';
    return 'linear-gradient(145deg, rgba(var(--primary-rgb),0.09) 0%, rgba(var(--primary-rgb),0.03) 100%)';
  }

  selectIcon(icon: string): void {
    this.selectedIcon.set(icon);
  }

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
          err.error?.message || 'No se pudo completar la operacion. Intenta de nuevo.',
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
          name: this.nameCtrl.value.trim(),
          description: this.descriptionCtrl.value.trim() || null,
          icon: this.selectedIcon(),
          cost: this.costCtrl.value!,
          minLevel: this.minLevelCtrl.value ?? null,
        })
      : this.rewardService.create({
          familyId,
          name: this.nameCtrl.value.trim(),
          description: this.descriptionCtrl.value.trim() || null,
          icon: this.selectedIcon(),
          cost: this.costCtrl.value!,
          minLevel: this.minLevelCtrl.value ?? null,
        });

    const successMsg = editing ? 'Recompensa actualizada exitosamente.' : 'Recompensa creada exitosamente.';
    const fallbackErr = editing
      ? 'No se pudo completar la operacion. Intenta de nuevo.'
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
    this.selectedIcon.set('\u{1F381}');
    this.createError.set('');
  }

  switchTab(tab: 'rewards' | 'history'): void {
    this.activeTab.set(tab);
  }
}
