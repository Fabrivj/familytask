import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { SpaceService } from '@core/services/space.service';
import { TaskService } from '@core/services/task.service';
import {
  CreateSpaceRequest,
  SPACE_TYPE_OPTIONS,
  SpaceResponse,
  SpaceType,
  UpdateSpaceRequest,
  spaceTypeColor,
  spaceTypeIcon,
  spaceTypeLabel,
} from '@core/models/space.model';
import { TaskResponse } from '@core/models/task.model';
import { priorityLabel } from '@core/utils/task-labels';
import { injectLoadingState } from '@core/utils/loading-state';
import { createFocusRestore } from '@core/utils/focus-restore';
import { fieldError } from '@core/utils/form-errors';
import { HttpErrorResponse } from '@angular/common/http';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-home-map',
  imports: [
    A11yModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
    PageHeaderComponent,
    ConfirmDialogComponent,
    UserAvatarComponent,
  ],
  templateUrl: './home-map.component.html',
  styleUrls: [
    '../tasks/shared/list-shared.css',
    './home-map.component.css',
    './home-map-cards.css',
    './home-map-panel.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeMapComponent {
  private readonly authService = inject(AuthService);
  private readonly spaceService = inject(SpaceService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  // ─── Helpers expuestos al template ───────────────────────────────────────
  readonly spaceTypeLabel = spaceTypeLabel;
  readonly spaceTypeIcon = spaceTypeIcon;
  readonly spaceTypeColor = spaceTypeColor;

  /** Pre-computed rgba styles per space type — avoids hex→rgba parsing on every CD tick. */
  readonly spaceIconStyles = computed(() => {
    const map = new Map<string, { bg: string; border: string; borderDim: string }>();
    for (const opt of SPACE_TYPE_OPTIONS) {
      const hex = spaceTypeColor(opt.value).replace('#', '');
      const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
      map.set(opt.value, {
        bg: `rgba(${r},${g},${b},0.12)`,
        border: `rgba(${r},${g},${b},0.35)`,
        borderDim: `rgba(${r},${g},${b},0.18)`,
      });
    }
    return map;
  });
  readonly spaceTypeOptions = SPACE_TYPE_OPTIONS;
  readonly priorityLabel = priorityLabel;

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly spaces = signal<SpaceResponse[]>([]);
  readonly tasks  = signal<TaskResponse[]>([]);

  /** Current user's name from session — used to highlight their assigned tasks. */
  readonly currentUserName = computed(() => this.authService.session()?.name ?? null);
  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;
  readonly error = this.ls.error;

  readonly spacesSubtitle = computed(() => {
    const n = this.spaces().length;
    return `${n} espacio${n !== 1 ? 's' : ''} registrado${n !== 1 ? 's' : ''}`;
  });

  readonly tasksBySpace = computed(() => {
    const map = new Map<number, TaskResponse[]>();
    for (const task of this.tasks()) {
      const list = map.get(task.homeSpaceId) ?? [];
      list.push(task);
      map.set(task.homeSpaceId, list);
    }
    return map;
  });

  /** Tasks visible to the current child — assigned to them OR unassigned. */
  readonly myTasksBySpace = computed(() => {
    const myName = this.currentUserName();
    const result = new Map<number, TaskResponse[]>();
    for (const [spaceId, tasks] of this.tasksBySpace()) {
      result.set(spaceId, tasks.filter(
        t => t.assignedToId === null || t.assignedToName === myName
      ));
    }
    return result;
  });

  /** Pre-resolved map used by the template — parent sees all, child sees theirs. */
  readonly visibleTasksBySpace = computed(() =>
    this.isParent() ? this.tasksBySpace() : this.myTasksBySpace()
  );

  // ─── Delete space (two-modal flow) ──────────────────────────────────────
  readonly showDeleteConfirm = signal(false);
  readonly spaceToDelete = signal<SpaceResponse | null>(null);
  readonly isDeleting = signal(false);

  readonly showMigrateModal = signal(false);
  readonly selectedTargetSpace = signal<SpaceResponse | null>(null);
  readonly migrateSpaceSelectOpen = signal(false);
  readonly isMigrating = signal(false);
  readonly availableTargetSpaces = computed(() =>
    this.spaces().filter(s =>
      s.id !== this.spaceToDelete()?.id && (this.tasksBySpace().get(s.id)?.length ?? 0) === 0
    )
  );
  readonly hasTargetSpaces = computed(() => this.availableTargetSpaces().length > 0);

  // ─── Panel de edición ─────────────────────────────────────────────────────
  readonly showEditPanel = signal(false);
  readonly spaceToEdit = signal<SpaceResponse | null>(null);
  readonly isEditing = signal(false);
  readonly editError = signal('');

  // ─── Panel de creación ────────────────────────────────────────────────────
  readonly showCreatePanel = signal(false);
  readonly isCreating = signal(false);
  readonly createError = signal('');

  readonly nameCtrl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
    ],
  });
  readonly selectedType = signal<SpaceType | null>(null);
  readonly typeError = signal(false);

  constructor() {
    effect(() => {
      const id = this.familyId();
      if (id) this.loadSpaces(id);
    });
  }

  private loadSpaces(familyId: number): void {
    this.spaces.set([]);
    this.tasks.set([]);

    this.ls.run(
      forkJoin({
        spaces: this.spaceService.getSpaces(familyId),
        tasks:  this.taskService.getTasks(familyId),
      }).pipe(takeUntilDestroyed(this.destroyRef)),
      {
        next: ({ spaces, tasks }) => {
          this.spaces.set(spaces);
          this.tasks.set(tasks);
        },
      },
    );
  }

  // ─── Panel ───────────────────────────────────────────────────────────────
  private readonly _panelFocus = createFocusRestore();

  openCreatePanel(): void {
    this._panelFocus.save();
    this.resetForm();
    this.showEditPanel.set(false);
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
    this._panelFocus.restore();
  }

  openEditPanel(space: SpaceResponse): void {
    this._panelFocus.save();
    this.showCreatePanel.set(false);
    this.spaceToEdit.set(space);
    this.nameCtrl.reset(space.name);
    this.selectedType.set(space.type);
    this.typeError.set(false);
    this.editError.set('');
    this.showEditPanel.set(true);
  }

  closeEditPanel(): void {
    this.showEditPanel.set(false);
    this.spaceToEdit.set(null);
    this.editError.set('');
    this._panelFocus.restore();
  }

  submitEdit(): void {
    this.nameCtrl.markAllAsTouched();
    const typeValid = this.selectedType() !== null;
    this.typeError.set(!typeValid);

    if (this.nameCtrl.invalid || !typeValid) return;

    const familyId = this.familyId();
    const space = this.spaceToEdit();
    if (!familyId || !space) return;

    this.isEditing.set(true);
    this.editError.set('');

    const request: UpdateSpaceRequest = {
      familyId,
      name: this.nameCtrl.value.trim(),
      type: this.selectedType()!,
    };

    this.spaceService.update(space.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.spaces.update(list => list.map(s => s.id === updated.id ? updated : s));
          this.isEditing.set(false);
          this.closeEditPanel();
          this.snackBar.open('Espacio actualizado exitosamente.', 'Cerrar', {
            duration: 4000,
            panelClass: 'snack-success',
          });
        },
        error: (err: HttpErrorResponse) => {
          this.editError.set(err.error?.message || 'No se pudo actualizar el espacio. Intenta de nuevo.');
          this.isEditing.set(false);
        },
      });
  }

  selectType(type: SpaceType): void {
    this.selectedType.set(type);
    this.typeError.set(false);
  }

  getNameError = () => fieldError(this.nameCtrl, { required: 'El nombre debe tener entre 2 y 50 caracteres.', minlength: 'El nombre debe tener entre 2 y 50 caracteres.', maxlength: 'El nombre debe tener entre 2 y 50 caracteres.' });

  submitCreate(): void {
    this.nameCtrl.markAllAsTouched();
    const typeValid = this.selectedType() !== null;
    this.typeError.set(!typeValid);

    if (this.nameCtrl.invalid || !typeValid) return;

    const familyId = this.familyId();
    if (!familyId) return;

    this.isCreating.set(true);
    this.createError.set('');

    const request: CreateSpaceRequest = {
      familyId,
      name: this.nameCtrl.value.trim(),
      type: this.selectedType()!,
    };

    this.spaceService.create(request).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.closeCreatePanel();
        this.snackBar.open('Espacio creado exitosamente.', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
        this.loadSpaces(familyId);
      },
      error: (err) => {
        this.createError.set(err.error?.message || 'No se pudo crear el espacio. Intenta de nuevo.');
        this.isCreating.set(false);
      },
    });
  }

  // ─── Delete space methods ────────────────────────────────────────────────
  requestDeleteSpace(space: SpaceResponse): void {
    this.spaceToDelete.set(space);
    this.showDeleteConfirm.set(true);
  }

  confirmDeleteSpace(): void {
    const space = this.spaceToDelete();
    const familyId = this.familyId();
    if (!space || !familyId) return;

    this.showDeleteConfirm.set(false);
    this.isDeleting.set(true);

    this.spaceService.delete(space.id, familyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.spaces.update(list => list.filter(s => s.id !== space.id));
          this.isDeleting.set(false);
          this.clearDeleteState();
          this.snackBar.open('Espacio eliminado exitosamente.', 'Cerrar', {
            duration: 4000,
            panelClass: 'snack-success',
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isDeleting.set(false);
          if (err.status === 409) {
            this.showMigrateModal.set(true);
          } else {
            this.clearDeleteState();
            this.snackBar.open(
              err.error?.message || 'No se pudo eliminar el espacio. Intenta de nuevo.',
              'Cerrar',
              { duration: 4000, panelClass: 'snack-error' }
            );
          }
        },
      });
  }

  cancelDeleteSpace(): void {
    this.showDeleteConfirm.set(false);
    this.clearDeleteState();
  }

  toggleMigrateSpaceSelect(): void {
    this.migrateSpaceSelectOpen.update(v => !v);
  }

  selectMigrateSpace(space: SpaceResponse): void {
    this.selectedTargetSpace.set(space);
    this.migrateSpaceSelectOpen.set(false);
  }

  confirmMigrate(): void {
    const space = this.spaceToDelete();
    const familyId = this.familyId();
    const targetId = this.selectedTargetSpace()?.id;
    if (!space || !familyId || !targetId) return;

    this.isMigrating.set(true);

    this.spaceService.delete(space.id, familyId, targetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isMigrating.set(false);
          this.showMigrateModal.set(false);
          this.clearDeleteState();
          this.snackBar.open('Tareas migradas y espacio eliminado exitosamente.', 'Cerrar', {
            duration: 4000,
            panelClass: 'snack-success',
          });
          this.loadSpaces(familyId);
        },
        error: (err: HttpErrorResponse) => {
          this.isMigrating.set(false);
          this.snackBar.open(
            err.error?.message || 'No se pudo migrar las tareas. Intenta de nuevo.',
            'Cerrar',
            { duration: 4000, panelClass: 'snack-error' }
          );
        },
      });
  }

  cancelMigrate(): void {
    this.showMigrateModal.set(false);
    this.clearDeleteState();
  }

  private clearDeleteState(): void {
    this.spaceToDelete.set(null);
    this.selectedTargetSpace.set(null);
    this.migrateSpaceSelectOpen.set(false);
  }

  navigateToAssignTask(space: SpaceResponse): void {
    this.router.navigate(['/tasks'], {
      queryParams: { openCreate: '1', spaceId: space.id },
    });
  }

  private resetForm(): void {
    this.nameCtrl.reset('');
    this.selectedType.set(null);
    this.typeError.set(false);
    this.createError.set('');
  }
}
