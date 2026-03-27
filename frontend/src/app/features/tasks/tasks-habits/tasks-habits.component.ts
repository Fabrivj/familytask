import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent } from '../../../shared/components/app-shell/app-shell.component';
import { TasksListComponent } from '../list/tasks-list.component';
import { HabitsListComponent } from '../habits/habits-list.component';

@Component({
  selector: 'app-tasks-habits',
  imports: [MatIconModule, AppShellComponent, TasksListComponent, HabitsListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell>
      <main class="content">

        <div class="header-row">
          <div class="header-info">
            <p class="tag">// GESTIÓN DE FAMILIA</p>
            <h1 class="page-title">Tareas y Hábitos</h1>
          </div>
        </div>

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

        @if (activeTab() === 'tasks') {
          <app-tasks-list />
        } @else {
          <app-habits-list />
        }

      </main>
    </app-shell>
  `,
  styles: [`
    .content {
      padding: 24px;
    }
    .header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-sub);
      margin: 0 0 4px;
    }
    .page-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
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
  `],
})
export class TasksHabitsComponent {
  readonly activeTab = signal<'tasks' | 'habits'>('tasks');

  switchTab(tab: 'tasks' | 'habits'): void {
    this.activeTab.set(tab);
  }
}
