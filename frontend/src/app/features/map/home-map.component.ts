import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
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
import { priorityLabel, statusLabel } from '../../core/utils/task-labels';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';

@Component({
  selector: 'app-home-map',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppShellComponent,
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

  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);
  readonly isParent = this.permissionsService.isParent;

  // ─── Helpers expuestos al template ───────────────────────────────────────
  readonly spaceTypeLabel = spaceTypeLabel;
  readonly spaceTypeIcon = spaceTypeIcon;
  readonly spaceTypeOptions = SPACE_TYPE_OPTIONS;
  readonly priorityLabel = priorityLabel;
  readonly statusLabel = statusLabel;

  // ─── Datos ────────────────────────────────────────────────────────────────
  readonly spaces = signal<SpaceResponse[]>([]);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

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

    this.spaceService.getSpaces(familyId).subscribe({
      next: (spaces) => {
        this.spaces.set(spaces);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'No se pudo cargar los espacios. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });

    this.taskService.getTasks(familyId).subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: () => {},
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
