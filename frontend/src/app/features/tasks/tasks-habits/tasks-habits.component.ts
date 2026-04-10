import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent } from '../../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TasksListComponent } from '../list/tasks-list.component';
import { HabitsListComponent } from '../habits/habits-list.component';
import { PermissionsService } from '../../../core/services/permissions.service';

@Component({
  selector: 'app-tasks-habits',
  imports: [MatIconModule, AppShellComponent, PageHeaderComponent, TasksListComponent, HabitsListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell>
      <main class="content">

        <app-page-header title="Tareas y Hábitos" [subtitle]="subtitle()" />

        <div class="tabs-row">
          <div class="tabs" role="tablist">
            <button class="tab" [class.tab-active]="activeTab() === 'tasks'"
                    role="tab" [attr.aria-selected]="activeTab() === 'tasks'"
                    (click)="switchTab('tasks')">
              <mat-icon class="tab-icon" aria-hidden="true">task_alt</mat-icon>
              TAREAS
            </button>
            <button class="tab" [class.tab-active]="activeTab() === 'habits'"
                    role="tab" [attr.aria-selected]="activeTab() === 'habits'"
                    (click)="switchTab('habits')">
              <mat-icon class="tab-icon" aria-hidden="true">schedule</mat-icon>
              HÁBITOS
            </button>
          </div>

          @if (isParent()) {
            <button class="btn-pill btn-add" type="button" (click)="openAddPanel()">
              <mat-icon aria-hidden="true">add</mat-icon>
              {{ activeTab() === 'tasks' ? 'NUEVA TAREA' : 'NUEVO HÁBITO' }}
            </button>
          }
        </div>

        @if (activeTab() === 'tasks') {
          <app-tasks-list #tasksList (countChange)="taskCount.set($event)" />
        } @else {
          <app-habits-list #habitsList (countChange)="habitCount.set($event)" />
        }

      </main>
    </app-shell>
  `,
  styles: [`
    .content {
      padding: 24px;
    }
    .tabs-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--text-sub);
      background: transparent;
      border: 1.5px solid transparent;
      border-radius: var(--radius);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-active {
      color: var(--primary);
      border-color: var(--primary);
    }
    .tab-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .btn-add {
      flex-shrink: 0;
    }
  `],
})
export class TasksHabitsComponent {
  private readonly permissionsService = inject(PermissionsService);

  @ViewChild('tasksList')  tasksList?: TasksListComponent;
  @ViewChild('habitsList') habitsList?: HabitsListComponent;

  readonly activeTab   = signal<'tasks' | 'habits'>('tasks');
  readonly isParent    = this.permissionsService.isParent;
  readonly taskCount   = signal(0);
  readonly habitCount  = signal(0);
  readonly subtitle    = computed(() => {
    if (this.activeTab() === 'tasks') {
      const n = this.taskCount();
      return `${n} tarea${n !== 1 ? 's' : ''} activa${n !== 1 ? 's' : ''}`;
    }
    const n = this.habitCount();
    return `${n} hábito${n !== 1 ? 's' : ''} activo${n !== 1 ? 's' : ''}`;
  });

  switchTab(tab: 'tasks' | 'habits'): void {
    this.activeTab.set(tab);
  }

  openAddPanel(): void {
    if (this.activeTab() === 'tasks') {
      this.tasksList?.openCreatePanel();
    } else {
      this.habitsList?.openCreatePanel();
    }
  }
}
