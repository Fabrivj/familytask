import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { MemberItemResponse, TaskPriority, TaskResponse } from '../../../core/models/task.model';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopBarComponent } from '../../../shared/components/top-bar/top-bar.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-tasks-list',
  imports: [
    LowerCasePipe,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageLayoutComponent,
    SidebarComponent,
    TopBarComponent,
    UserAvatarComponent,
  ],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // ─── Session ──────────────────────────────────────────────────────────────
  readonly session = this.authService.session;

  readonly shortName = computed(() => {
    const name = this.session()?.name ?? '';
    return name.split(' ')[0];
  });

  readonly familyId = computed(() => this.authService.getActiveFamilyId());

  readonly familyName = computed(() => {
    const families = this.authService.families();
    const activeId = this.familyId();
    return families.find(f => f.familyId === activeId)?.familyName ?? 'Tu familia';
  });

  readonly isParent = computed(() => {
    const families = this.authService.families();
    const activeId = this.familyId();
    return families.find(f => f.familyId === activeId)?.role === 'PARENT';
  });

  readonly userRoleLabel = this.authService.activeRoleLabel;

  // ─── Data ─────────────────────────────────────────────────────────────────
  readonly tasks = signal<TaskResponse[]>([]);
  readonly members = signal<MemberItemResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  // ─── Filters ──────────────────────────────────────────────────────────────
  readonly filterPriority = signal<string | null>(null);
  readonly filterZone = signal<string | null>(null);
  readonly filterMemberId = signal<number | null>(null);
  readonly searchQuery = signal('');

  readonly zones = computed(() => {
    const locations = this.tasks().map(t => t.location).filter(Boolean);
    return [...new Set(locations)];
  });

  readonly childMembers = computed(() =>
    this.members().filter(m => m.role === 'CHILD')
  );

  readonly filteredTasks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.tasks().filter(t =>
      (!this.filterPriority() || t.priority === this.filterPriority()) &&
      (!this.filterZone() || t.location === this.filterZone()) &&
      (!this.filterMemberId() || t.assignedToId === this.filterMemberId()) &&
      (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    );
  });

  // ─── Create panel ────────────────────────────────────────────────────────
  readonly showCreatePanel = signal(false);
  readonly isCreating = signal(false);
  readonly createError = signal('');

  readonly titleCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(100)],
  });
  readonly descriptionCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });
  readonly selectedPriority = signal<TaskPriority>('MEDIUM');
  readonly xpRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });
  readonly coinsRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });
  readonly locationCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly dueDateCtrl = new FormControl<string | null>(null);
  readonly minDate = new Date().toISOString().slice(0, 10);
  readonly selectedAssignee = signal<number | null>(null);

  // ─── Delete modal ─────────────────────────────────────────────────────────
  readonly showDeleteModal = signal(false);
  readonly taskToDelete = signal<TaskResponse | null>(null);

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id) this.loadData(id);
    });
  }

  // ─── Load ─────────────────────────────────────────────────────────────────
  private loadData(familyId: number): void {
    this.isLoading.set(true);
    this.error.set('');

    this.taskService.getTasks(familyId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? 'Error al cargar las tareas. Por favor, intente nuevamente.'
        );
        this.isLoading.set(false);
      },
    });

    if (this.isParent()) {
      this.taskService.getMembers(familyId).subscribe({
        next: (members) => this.members.set(members),
        error: () => {},
      });
    }
  }

  // ─── Filters ──────────────────────────────────────────────────────────────
  togglePriority(value: string): void {
    this.filterPriority.set(this.filterPriority() === value ? null : value);
  }

  toggleZone(value: string): void {
    this.filterZone.set(this.filterZone() === value ? null : value);
  }

  toggleMember(id: number): void {
    this.filterMemberId.set(this.filterMemberId() === id ? null : id);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  priorityLabel(p: string): string {
    return { HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA' }[p] ?? p;
  }

  statusLabel(s: string): string {
    return { PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada' }[s] ?? s;
  }

  memberShortName(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return parts[0];
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hoy';
    return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  }

  // ─── Error getters ────────────────────────────────────────────────────────
  getTitleError(): string {
    const c = this.titleCtrl;
    if (c.hasError('required')) return 'El campo Título es obligatorio.';
    if (c.hasError('maxlength')) return 'Máximo 100 caracteres.';
    return '';
  }

  getDescriptionError(): string {
    const c = this.descriptionCtrl;
    if (c.hasError('required')) return 'El campo Descripción es obligatorio.';
    if (c.hasError('maxlength')) return 'Máximo 500 caracteres.';
    return '';
  }

  getXpError(): string {
    if (this.xpRewardCtrl.hasError('required')) return 'Requerido.';
    if (this.xpRewardCtrl.hasError('min')) return 'Mínimo 1.';
    return '';
  }

  getCoinsError(): string {
    if (this.coinsRewardCtrl.hasError('required')) return 'Requerido.';
    if (this.coinsRewardCtrl.hasError('min')) return 'Mínimo 1.';
    return '';
  }

  getLocationError(): string {
    if (this.locationCtrl.hasError('required')) return 'El campo Zona es obligatorio.';
    return '';
  }

  // ─── Create panel ────────────────────────────────────────────────────────
  openCreatePanel(): void {
    this.resetForm();
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
  }

  selectPriority(p: TaskPriority): void {
    this.selectedPriority.set(p);
  }

  selectAssignee(userId: number): void {
    this.selectedAssignee.set(this.selectedAssignee() === userId ? null : userId);
  }

  submitCreate(): void {
    [this.titleCtrl, this.descriptionCtrl, this.xpRewardCtrl, this.coinsRewardCtrl, this.locationCtrl]
      .forEach(c => c.markAllAsTouched());

    if (
      this.titleCtrl.invalid ||
      this.descriptionCtrl.invalid ||
      this.xpRewardCtrl.invalid ||
      this.coinsRewardCtrl.invalid ||
      this.locationCtrl.invalid
    ) return;

    const familyId = this.familyId();
    if (!familyId) return;

    this.isCreating.set(true);
    this.createError.set('');

    const dueDate = this.dueDateCtrl.value ?? null;

    this.taskService.create({
      familyId,
      title: this.titleCtrl.value.trim(),
      description: this.descriptionCtrl.value.trim(),
      priority: this.selectedPriority(),
      xpReward: this.xpRewardCtrl.value!,
      coinsReward: this.coinsRewardCtrl.value!,
      location: this.locationCtrl.value.trim(),
      dueDate,
      assignedToId: this.selectedAssignee(),
    }).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.closeCreatePanel();
        this.snackBar.open('Tarea guardada correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
        this.loadData(familyId);
      },
      error: (err) => {
        this.createError.set(
          err.error?.message ?? 'Ocurrió un error al crear la tarea. Por favor, intente nuevamente.'
        );
        this.isCreating.set(false);
      },
    });
  }

  private resetForm(): void {
    this.titleCtrl.reset('');
    this.descriptionCtrl.reset('');
    this.selectedPriority.set('MEDIUM');
    this.xpRewardCtrl.reset(null);
    this.coinsRewardCtrl.reset(null);
    this.locationCtrl.reset('');
    this.dueDateCtrl.reset(null);
    this.selectedAssignee.set(null);
    this.createError.set('');
  }

  // ─── Delete modal ────────────────────────────────────────────────────────
  openDeleteModal(task: TaskResponse): void {
    this.taskToDelete.set(task);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.taskToDelete.set(null);
  }

  confirmDelete(): void {
    this.closeDeleteModal();
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], { state: { message: response.message } });
      },
      error: () => {
        this.snackBar.open('No se pudo cerrar sesión. Intenta de nuevo.', 'Cerrar', {
          duration: 4000, panelClass: 'snack-error',
        });
      },
    });
  }
}
