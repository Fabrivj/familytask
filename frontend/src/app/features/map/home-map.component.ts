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
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { SpaceService } from '../../core/services/space.service';
import { TaskService } from '../../core/services/task.service';
import {
  CreateSpaceRequest,
  SPACE_TYPE_OPTIONS,
  SpaceResponse,
  SpaceType,
  spaceTypeIcon,
  spaceTypeLabel,
} from '../../core/models/space.model';
import { TaskResponse } from '../../core/models/task.model';
import { priorityLabel } from '../../core/utils/task-labels';
import { HttpErrorResponse } from '@angular/common/http';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-home-map',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
    PageHeaderComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './home-map.component.html',
  styleUrl: './home-map.component.css',
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
  readonly spaceTypeOptions = SPACE_TYPE_OPTIONS;
  readonly priorityLabel = priorityLabel;

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly spaces = signal<SpaceResponse[]>([]);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

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

  tasksForSpace(spaceId: number): TaskResponse[] {
    return this.tasksBySpace().get(spaceId) ?? [];
  }

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
      s.id !== this.spaceToDelete()?.id && this.tasksForSpace(s.id).length === 0
    )
  );
  readonly hasTargetSpaces = computed(() => this.availableTargetSpaces().length > 0);

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
    this.isLoading.set(true);
    this.error.set('');
    this.spaces.set([]);
    this.tasks.set([]);

    forkJoin({
      spaces: this.spaceService.getSpaces(familyId),
      tasks: this.taskService.getTasks(familyId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ spaces, tasks }) => {
          this.spaces.set(spaces);
          this.tasks.set(tasks);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'No se pudo cargar los espacios. Intenta de nuevo.');
          this.isLoading.set(false);
        },
      });
  }

  // ─── Panel ───────────────────────────────────────────────────────────────
  openCreatePanel(): void {
    this.resetForm();
    this.showCreatePanel.set(true);
  }

  closeCreatePanel(): void {
    this.showCreatePanel.set(false);
    this.createError.set('');
  }

  selectType(type: SpaceType): void {
    this.selectedType.set(type);
    this.typeError.set(false);
  }

  getNameError(): string {
    const c = this.nameCtrl;
    if (c.hasError('required') || c.hasError('minlength') || c.hasError('maxlength')) {
      return 'El nombre debe tener entre 2 y 50 caracteres.';
    }
    return '';
  }

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
