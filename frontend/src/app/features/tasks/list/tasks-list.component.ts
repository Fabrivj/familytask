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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TaskService } from '../../../core/services/task.service';
import { MembersService } from '../../../core/services/members.service';
import { priorityLabel, statusLabel } from '../../../core/utils/task-labels';
import { TaskPriority, TaskResponse } from '../../../core/models/task.model';
import { MemberItem } from '../../../core/models/member.model';
import { AppShellComponent } from '../../../shared/components/app-shell/app-shell.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-tasks-list',
  imports: [
    LowerCasePipe,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
    UserAvatarComponent,
  ],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly membersService = inject(MembersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly tasks = signal<TaskResponse[]>([]);
  readonly members = signal<MemberItem[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  // ─── Filtros ──────────────────────────────────────────────────────────────
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

  // ─── Modal de borrado ─────────────────────────────────────────────────────
  readonly showDeleteModal = signal(false);
  readonly taskToDelete = signal<TaskResponse | null>(null);

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id) this.loadData(id);
    });
  }

  private loadData(familyId: number): void {
    this.isLoading.set(true);
    this.error.set('');

    this.taskService.getTasks(familyId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar las tareas. Por favor, intente nuevamente.');
        this.isLoading.set(false);
      },
    });

    // Solo los padres pueden asignar tareas, así que no necesitamos la lista de miembros para hijos
    if (this.isParent()) {
      this.membersService.getMembers(familyId).subscribe({
        next: (res) => this.members.set(res.members),
        error: () => {},
      });
    }
  }

  // ─── Filtros ──────────────────────────────────────────────────────────────
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
  readonly priorityLabel = priorityLabel;
  readonly statusLabel = statusLabel;

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

  // ─── Validación del formulario ────────────────────────────────────────────
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

  // ─── Panel de creación ────────────────────────────────────────────────────
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

    this.taskService.create({
      familyId,
      title: this.titleCtrl.value.trim(),
      description: this.descriptionCtrl.value.trim(),
      priority: this.selectedPriority(),
      xpReward: this.xpRewardCtrl.value!,
      coinsReward: this.coinsRewardCtrl.value!,
      location: this.locationCtrl.value.trim(),
      dueDate: this.dueDateCtrl.value ?? null,
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
        this.createError.set(err.error?.message ?? 'Ocurrió un error al crear la tarea. Por favor, intente nuevamente.');
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

  // ─── Modal de borrado ─────────────────────────────────────────────────────
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

}
