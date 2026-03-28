import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TaskService } from '../../../core/services/task.service';
import { MembersService } from '../../../core/services/members.service';
import { SpaceService } from '../../../core/services/space.service';
import { priorityLabel, statusLabel } from '../../../core/utils/task-labels';
import { TaskPriority, TaskResponse, TaskStatus } from '../../../core/models/task.model';
import { MemberItem } from '../../../core/models/member.model';
import { SpaceResponse, spaceTypeIcon } from '../../../core/models/space.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tasks-list',
  imports: [
    LowerCasePipe,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    UserAvatarComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent {
  private readonly el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.spaceDropdownOpen() && !this.el.nativeElement.querySelector('.space-dropdown-wrap')?.contains(target)) {
      this.spaceDropdownOpen.set(false);
    }
    if (this.spaceSelectOpen() && !this.el.nativeElement.querySelector('.panel-space-dropdown-wrap')?.contains(target)) {
      this.spaceSelectOpen.set(false);
    }
  }

  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly membersService = inject(MembersService);
  private readonly spaceService = inject(SpaceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  readonly spaceTypeIcon = spaceTypeIcon;

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly tasks = signal<TaskResponse[]>([]);
  readonly members = signal<MemberItem[]>([]);
  readonly spaces = signal<SpaceResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  // ─── Filtros ──────────────────────────────────────────────────────────────
  readonly filterPriority = signal<string | null>(null);
  readonly filterSpaceId = signal<number | null>(null);
  readonly filterMemberId = signal<number | null>(null);
  readonly searchQuery = signal('');
  readonly spaceDropdownOpen = signal(false);

  readonly selectedFilterSpace = computed(() =>
    this.spaces().find(s => s.id === this.filterSpaceId()) ?? null
  );

  readonly childMembers = computed(() =>
    this.members().filter(m => m.role === 'CHILD')
  );

  readonly filteredTasks = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.tasks().filter(t =>
      (!this.filterPriority() || t.priority === this.filterPriority()) &&
      (!this.filterSpaceId() || t.homeSpaceId === this.filterSpaceId()) &&
      (!this.filterMemberId() || t.assignedToId === this.filterMemberId()) &&
      (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    );
  });

  // ─── Panel de creación / edición ─────────────────────────────────────────
  readonly showCreatePanel = signal(false);
  readonly isCreating = signal(false);
  readonly createError = signal('');
  readonly editingTask = signal<TaskResponse | null>(null);
  readonly isEditMode = computed(() => this.editingTask() !== null);
  readonly selectedStatus = signal<TaskStatus>('PENDING');

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
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  readonly coinsRewardCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
  });
  readonly selectedSpace = signal<SpaceResponse | null>(null);
  readonly spaceError = signal(false);
  readonly spaceSelectOpen = signal(false);
  readonly dueDateCtrl = new FormControl<Date | null>(null);
  readonly minDateObj = new Date();
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
        this.error.set(err.error?.message || 'Error al cargar las tareas. Por favor, intente nuevamente.');
        this.isLoading.set(false);
      },
    });

    if (this.isParent()) {
      this.membersService.getMembers(familyId).subscribe({
        next: (res) => this.members.set(res.members),
        error: () => {},
      });
      this.spaceService.getSpaces(familyId).subscribe({
        next: (s) => {
          this.spaces.set(s);
          this.applyQueryParamPreselect();
        },
        error: () => {},
      });
    }
  }

  // ─── Filtros ──────────────────────────────────────────────────────────────
  togglePriority(value: string): void {
    this.filterPriority.set(this.filterPriority() === value ? null : value);
  }

  toggleSpaceDropdown(): void {
    this.spaceDropdownOpen.set(!this.spaceDropdownOpen());
  }

  selectSpaceFilter(id: number | null): void {
    this.filterSpaceId.set(id);
    this.spaceDropdownOpen.set(false);
  }

  toggleMember(id: number): void {
    this.filterMemberId.set(this.filterMemberId() === id ? null : id);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  readonly priorityLabel = priorityLabel;
  readonly statusLabel = statusLabel;

  memberShortName(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
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

  // ─── Panel de creación / edición ─────────────────────────────────────────
  openCreatePanel(): void {
    this.resetForm();
    this.showCreatePanel.set(true);
  }

  openEditPanel(task: TaskResponse): void {
    this.resetForm();
    this.editingTask.set(task);
    this.titleCtrl.setValue(task.title);
    this.descriptionCtrl.setValue(task.description);
    this.selectedPriority.set(task.priority as TaskPriority);
    this.selectedStatus.set(task.status as TaskStatus);
    this.xpRewardCtrl.setValue(task.xpReward);
    this.coinsRewardCtrl.setValue(task.coinsReward);
    const space = this.spaces().find(s => s.id === task.homeSpaceId) ?? null;
    this.selectedSpace.set(space);
    if (task.dueDate) {
      const [y, m, d] = task.dueDate.split('-').map(Number);
      this.dueDateCtrl.setValue(new Date(y, m - 1, d));
    }
    this.selectedAssignee.set(task.assignedToId);
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
    this.editingTask.set(null);
  }

  selectPriority(p: TaskPriority): void {
    this.selectedPriority.set(p);
  }

  selectSpace(space: SpaceResponse): void {
    this.selectedSpace.set(space);
    this.spaceError.set(false);
    this.spaceSelectOpen.set(false);
  }

  toggleSpaceSelect(): void {
    this.spaceSelectOpen.set(!this.spaceSelectOpen());
  }

  selectAssignee(userId: number): void {
    this.selectedAssignee.set(this.selectedAssignee() === userId ? null : userId);
  }

  submitCreate(): void {
    [this.titleCtrl, this.descriptionCtrl, this.xpRewardCtrl, this.coinsRewardCtrl]
      .forEach(c => c.markAllAsTouched());

    const spaceValid = this.selectedSpace() !== null;
    this.spaceError.set(!spaceValid);

    if (
      this.titleCtrl.invalid ||
      this.descriptionCtrl.invalid ||
      this.xpRewardCtrl.invalid ||
      this.coinsRewardCtrl.invalid ||
      !spaceValid
    ) return;

    const familyId = this.familyId();
    if (!familyId) return;

    this.isCreating.set(true);
    this.createError.set('');

    const editing = this.editingTask();

    const request$ = editing
      ? this.taskService.update(editing.id, {
          familyId,
          homeSpaceId: this.selectedSpace()!.id,
          title: this.titleCtrl.value.trim(),
          description: this.descriptionCtrl.value.trim(),
          priority: this.selectedPriority(),
          status: this.selectedStatus(),
          xpReward: this.xpRewardCtrl.value!,
          coinsReward: this.coinsRewardCtrl.value!,
          dueDate: this.dueDateCtrl.value
            ? this.toIsoDate(this.dueDateCtrl.value)
            : null,
          assignedToId: this.selectedAssignee(),
        })
      : this.taskService.create({
          familyId,
          homeSpaceId: this.selectedSpace()!.id,
          title: this.titleCtrl.value.trim(),
          description: this.descriptionCtrl.value.trim(),
          priority: this.selectedPriority(),
          xpReward: this.xpRewardCtrl.value!,
          coinsReward: this.coinsRewardCtrl.value!,
          dueDate: this.dueDateCtrl.value
            ? this.toIsoDate(this.dueDateCtrl.value)
            : null,
          assignedToId: this.selectedAssignee(),
        });

    const successMsg = editing ? 'Tarea actualizada correctamente' : 'Tarea guardada correctamente';
    const errorMsg = editing
      ? 'Ocurrió un error al actualizar la tarea. Por favor, intente nuevamente.'
      : 'Ocurrió un error al crear la tarea. Por favor, intente nuevamente.';

    request$.subscribe({
      next: () => {
        this.isCreating.set(false);
        this.closeCreatePanel();
        this.snackBar.open(successMsg, 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
        this.loadData(familyId);
      },
      error: (err) => {
        this.createError.set(err.error?.message || errorMsg);
        this.isCreating.set(false);
      },
    });
  }

  private applyQueryParamPreselect(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('openCreate') !== '1') return;
    const spaceId = Number(params.get('spaceId'));
    const space = spaceId ? this.spaces().find(s => s.id === spaceId) : null;
    this.resetForm();
    if (space) this.selectedSpace.set(space);
    this.showCreatePanel.set(true);
    this.router.navigate([], { replaceUrl: true, queryParams: {} });
  }

  private toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private resetForm(): void {
    this.editingTask.set(null);
    this.titleCtrl.reset('');
    this.descriptionCtrl.reset('');
    this.selectedPriority.set('MEDIUM');
    this.selectedStatus.set('PENDING');
    this.xpRewardCtrl.reset(null);
    this.coinsRewardCtrl.reset(null);
    this.selectedSpace.set(null);
    this.spaceError.set(false);
    this.spaceSelectOpen.set(false);
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
    const task = this.taskToDelete();
    if (!task) return;
    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.id !== task.id));
        this.closeDeleteModal();
        this.snackBar.open('Tarea eliminada correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
      },
      error: (err) => {
        this.closeDeleteModal();
        this.snackBar.open(
          err.error?.message || 'Ocurrió un error al eliminar la tarea. Por favor, intente nuevamente.',
          'Cerrar',
          { duration: 5000, panelClass: 'snack-error' },
        );
      },
    });
  }
}
