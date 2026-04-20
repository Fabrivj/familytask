import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { MembersService } from '@core/services/members.service';
import { PermissionsService } from '@core/services/permissions.service';
import { SuggestionService } from '@core/services/suggestion.service';
import { SuggestionStateService } from '@core/services/suggestion-state.service';
import { TaskService } from '@core/services/task.service';
import { HabitService } from '@core/services/habit.service';
import { SpaceService } from '@core/services/space.service';
import {
  SuggestionCategory,
  SuggestionItem,
  SuggestionRequest,
  SUGGESTION_CATEGORIES,
} from '@core/models/suggestion.model';
import { MemberItem } from '@core/models/member.model';
import { SpaceResponse } from '@core/models/space.model';
import { CreateTaskRequest, TaskPriority } from '@core/models/task.model';
import { CreateHabitRequest, HabitFrequency } from '@core/models/habit.model';
import { injectLoadingState } from '@core/utils/loading-state';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

type CardAddStatus = 'idle' | 'editing' | 'selecting-space' | 'adding' | 'added' | 'error';
interface CardState {
  status: CardAddStatus;
  errorMessage?: string;
  selectedSpaceId?: number;
  selectedSpaceName?: string;
  pendingItem?: SuggestionItem;
  editedNombre?: string;
  editedDescripcion?: string;
  editedFrecuencia?: string;
  editedComplejidad?: string;
  editedMonedas?: number;
  editedExp?: number;
}

@Component({
  selector: 'app-suggestions',
  imports: [AppShellComponent, PageHeaderComponent, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <app-shell>
      <main class="content">
        <app-page-header
          tag="// ASISTENTE IA"
          title="Sugerencias de tareas y hábitos"
          subtitle="Planifica mejor sin improvisar."
        />

        <section class="filters-card">
          <div class="filters-grid">
            <label class="field">
              <span class="field-label">Categoría</span>
              <select
                class="field-control"
                [value]="selectedCategory()"
                (change)="onCategoryChange($event)"
              >
                <option value="">Selecciona una categoría</option>
                @for (category of categoryOptions; track category.value) {
                  <option [value]="category.value">{{ category.label }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Miembro seleccionado</span>
              <select
                class="field-control"
                [value]="selectedMemberUserId() ?? ''"
                (change)="onMemberChange($event)"
              >
                <option value="">Selecciona un miembro</option>
                @for (member of selectableMembers(); track member.id) {
                  <option [value]="member.id">{{ member.name }}</option>
                }
              </select>
            </label>
          </div>

          <button class="btn-generate" type="button" (click)="generateSuggestions()" [disabled]="isLoading()">
            <mat-icon aria-hidden="true">auto_awesome</mat-icon>
            Generar sugerencias
          </button>
        </section>

        @if (localValidationError()) {
          <div class="state-box state-warning">{{ localValidationError() }}</div>
        }

        @if (error()) {
          <div class="state-box state-error">{{ error() }}</div>
        }

        @if (isLoading()) {
          <div class="loading-wrap">
            <mat-spinner diameter="32"></mat-spinner>
            <p>Generando sugerencias...</p>
          </div>
        }

        @if (!isLoading() && !error() && infoMessage()) {
          <div class="state-box state-info">{{ infoMessage() }}</div>
        }

        @if (!isLoading() && !error() && suggestions().length) {
          <div class="prefetch-bar">
            @if (prefetchedSuggestions()?.length) {
              <button
                class="btn-refresh"
                type="button"
                (click)="loadPrefetched()"
              >
                <mat-icon aria-hidden="true">refresh</mat-icon>
                Cargar más sugerencias
              </button>
            } @else if (isPrefetching()) {
              <span class="prefetch-hint">
                <mat-spinner diameter="14"></mat-spinner>
                Preparando más...
              </span>
            }
          </div>

          <section class="suggestions-grid">
            @for (item of suggestions(); track item.id) {
              <article class="suggestion-card">
                <header class="card-header">
                  <h3>{{ item.nombre }}</h3>
                  <span class="chip">{{ formatTipo(item.tipo) }}</span>
                </header>

                <p class="description">{{ item.descripcion }}</p>

                <div class="meta-row">
                  <span class="meta">Frecuencia: {{ formatFrecuencia(item.frecuencia) }}</span>
                  <span class="meta">Complejidad: {{ item.complejidad }}</span>
                </div>

                <div class="rewards-row">
                  <span class="reward">+{{ item.monedas }} monedas</span>
                  <span class="reward">+{{ item.exp }} EXP</span>
                </div>

                <p class="motivator">{{ item.mensajeMotivador }}</p>

                @if (getCardState(item.id).status === 'idle' || getCardState(item.id).status === 'error') {
                  @if (getCardState(item.id).errorMessage) {
                    <p class="card-error">{{ getCardState(item.id).errorMessage }}</p>
                  }
                  <div class="card-actions">
                    <button class="btn-cta btn-add-suggestion" type="button" (click)="addSuggestion(item)">
                      <mat-icon aria-hidden="true">add_circle_outline</mat-icon>
                      Agregar
                    </button>
                    <button class="btn-edit" type="button" (click)="startEdit(item)">
                      <mat-icon aria-hidden="true">edit</mat-icon>
                      Editar
                    </button>
                  </div>
                }

                @if (getCardState(item.id).status === 'editing') {
                  <div class="card-edit-form">
                    <label class="edit-field">
                      <span class="edit-label">Nombre</span>
                      <input
                        class="edit-input"
                        type="text"
                        [value]="getCardState(item.id).editedNombre ?? item.nombre"
                        (input)="onEditField(item.id, 'nombre', $event)"
                      />
                    </label>
                    <label class="edit-field">
                      <span class="edit-label">Descripción</span>
                      <textarea
                        class="edit-input edit-textarea"
                        rows="3"
                        [value]="getCardState(item.id).editedDescripcion ?? item.descripcion"
                        (input)="onEditField(item.id, 'descripcion', $event)"
                      ></textarea>
                    </label>
                    <div class="edit-row">
                      <label class="edit-field">
                        <span class="edit-label">Frecuencia</span>
                        <div class="edit-select-wrap">
                          <select
                            class="edit-input edit-select"
                            [value]="getCardState(item.id).editedFrecuencia ?? item.frecuencia"
                            (change)="onEditField(item.id, 'frecuencia', $event)"
                          >
                            <option value="DAILY">Diaria</option>
                            <option value="WEEKLY">Semanal</option>
                            <option value="WEEKDAYS">Días hábiles</option>
                            <option value="WEEKENDS">Fin de semana</option>
                            <option value="MONTHLY">Mensual</option>
                          </select>
                          <mat-icon class="edit-select-icon" aria-hidden="true">expand_more</mat-icon>
                        </div>
                      </label>
                      <label class="edit-field">
                        <span class="edit-label">Complejidad</span>
                        <div class="edit-select-wrap">
                          <select
                            class="edit-input edit-select"
                            [value]="getCardState(item.id).editedComplejidad ?? item.complejidad"
                            (change)="onEditField(item.id, 'complejidad', $event)"
                          >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                          </select>
                          <mat-icon class="edit-select-icon" aria-hidden="true">expand_more</mat-icon>
                        </div>
                      </label>
                    </div>
                    <div class="edit-row">
                      <label class="edit-field">
                        <span class="edit-label">Monedas</span>
                        <input
                          class="edit-input"
                          type="number"
                          min="0"
                          [value]="getCardState(item.id).editedMonedas ?? item.monedas"
                          (input)="onEditNumericField(item.id, 'monedas', $event)"
                        />
                      </label>
                      <label class="edit-field">
                        <span class="edit-label">EXP</span>
                        <input
                          class="edit-input"
                          type="number"
                          min="0"
                          [value]="getCardState(item.id).editedExp ?? item.exp"
                          (input)="onEditNumericField(item.id, 'exp', $event)"
                        />
                      </label>
                    </div>
                    <div class="edit-actions">
                      <button class="btn-cta btn-add-suggestion" type="button" (click)="confirmEdit(item)">
                        <mat-icon aria-hidden="true">add_circle_outline</mat-icon>
                        Agregar
                      </button>
                      <button class="btn-edit-cancel" type="button" (click)="cancelEdit(item.id)">
                        Cancelar
                      </button>
                    </div>
                  </div>
                }

                @if (getCardState(item.id).status === 'selecting-space') {
                  <div class="card-space-wrap">
                    <div class="card-space-dropdown-wrap">
                      <button
                        class="card-space-trigger"
                        [class.has-value]="!!getCardState(item.id).selectedSpaceId"
                        type="button"
                        (click)="toggleSpacePicker(item.id)"
                      >
                        <mat-icon aria-hidden="true">home</mat-icon>
                        <span>{{ getSelectedSpaceName(item.id) }}</span>
                        <mat-icon class="chevron" aria-hidden="true">expand_more</mat-icon>
                      </button>
                      @if (spacePickerOpenId() === item.id) {
                        <ul class="card-space-menu" role="listbox">
                          @for (s of spaces(); track s.id) {
                            <li
                              class="card-space-item"
                              role="option"
                              [class.active]="getCardState(item.id).selectedSpaceId === s.id"
                              (click)="selectSpace(item.id, s.id, s.name)"
                            >
                              <mat-icon aria-hidden="true">home</mat-icon>
                              {{ s.name }}
                            </li>
                          }
                        </ul>
                      }
                    </div>
                    <button
                      class="btn-cta btn-confirm-task"
                      type="button"
                      [disabled]="!getCardState(item.id).selectedSpaceId"
                      (click)="confirmAddTask(item)"
                    >
                      <mat-icon aria-hidden="true">check</mat-icon>
                      Crear tarea
                    </button>
                  </div>
                }

                @if (getCardState(item.id).status === 'adding') {
                  <div class="card-loading">
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>Agregando...</span>
                  </div>
                }

                @if (getCardState(item.id).status === 'added') {
                  <button class="btn-cta btn-add-suggestion" disabled>
                    <mat-icon aria-hidden="true">check_circle</mat-icon>
                    Agregado
                  </button>
                }
              </article>
            }
          </section>
        }
      </main>
    </app-shell>
  `,
  styles: [`
    .content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .filters-card {
      background: rgba(12, 18, 40, 0.65);
      border: 1px solid rgba(0, 239, 255, 0.2);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-sub);
    }

    .field-control {
      background: rgba(var(--border-rgb), 0.03);
      border: 1.5px solid rgba(var(--border-rgb), 0.18);
      border-radius: var(--radius);
      color: var(--text);
      padding: 0 12px;
      font-size: 14px;
      outline: none;
      height: 40px;
      width: 100%;
      transition: border-color 0.2s;
      cursor: pointer;
    }

    .field-control:focus {
      border-color: var(--border);
      box-shadow: 0 0 0 2px rgba(var(--border-rgb), 0.12);
    }

    .field-control option {
      background: var(--panel);
      color: var(--text);
    }

    .btn-generate {
      margin-top: 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(0, 239, 255, 0.35);
      background: rgba(0, 239, 255, 0.08);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .btn-generate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .state-box {
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .state-warning {
      border: 1px solid rgba(255, 184, 0, 0.4);
      background: rgba(255, 184, 0, 0.1);
      color: #ffd577;
    }

    .state-error {
      border: 1px solid rgba(255, 80, 80, 0.4);
      background: rgba(255, 80, 80, 0.1);
      color: #ffb0b0;
    }

    .state-info {
      border: 1px solid rgba(0, 239, 255, 0.35);
      background: rgba(0, 239, 255, 0.08);
      color: var(--text);
    }

    .loading-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      color: var(--text-sub);
    }

    .prefetch-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      min-height: 36px;
      margin-bottom: 12px;
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1.5px solid rgba(var(--border-rgb), 0.25);
      background: transparent;
      color: var(--text-sub);
      padding: 8px 14px;
      border-radius: 9px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
    }

    .btn-refresh:hover {
      border-color: var(--border);
      color: var(--text);
      box-shadow: 0 0 10px rgba(var(--border-rgb), 0.25);
      text-shadow: 0 0 6px rgba(var(--border-rgb), 0.3);
    }

    .prefetch-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-sub);
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.08em;
      opacity: 0.7;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      padding-bottom: 80px;
    }

    .suggestion-card {
      background: rgba(11, 17, 38, 0.7);
      border: 1px solid rgba(0, 239, 255, 0.2);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
      box-sizing: border-box;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .card-header h3 {
      margin: 0;
      font-family: 'Rajdhani', sans-serif;
      font-size: 20px;
      color: var(--text);
    }

    .chip {
      border: 1px solid rgba(0, 239, 255, 0.25);
      border-radius: 999px;
      padding: 2px 10px;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-sub);
      white-space: nowrap;
    }

    .description {
      margin: 0;
      color: var(--text-sub);
      font-size: 14px;
      line-height: 1.35;
    }

    .meta-row,
    .rewards-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .meta,
    .reward {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-sub);
    }

    .reward {
      color: var(--primary);
      border-color: rgba(0, 239, 255, 0.3);
    }

    .motivator {
      margin: 0;
      font-size: 13px;
      color: var(--text);
      border-top: 1px dashed rgba(255, 255, 255, 0.12);
      padding-top: 8px;
      flex: 1;
    }

    /* ── Botones (design system) ── */
    .btn-add-suggestion {
      padding: 10px 14px;
      font-size: 13px;
    }

    .btn-confirm-task {
      padding: 10px 14px;
      font-size: 13px;
    }

    /* ── Acciones idle: Agregar + Editar ── */
    .card-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-edit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1.5px solid rgba(var(--border-rgb), 0.25);
      background: transparent;
      color: var(--text-sub);
      padding: 9px 14px;
      border-radius: 9px;
      cursor: pointer;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
      transition: border-color 0.2s, color 0.2s;
    }

    .btn-edit:hover {
      border-color: rgba(var(--border-rgb), 0.5);
      color: var(--text);
    }

    /* ── Formulario de edición inline ── */
    .card-edit-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
      padding-top: 10px;
    }

    .edit-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .edit-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-sub);
    }

    .edit-input {
      background: rgba(var(--border-rgb), 0.04);
      border: 1.5px solid rgba(var(--border-rgb), 0.18);
      border-radius: 8px;
      color: var(--text);
      padding: 8px 10px;
      font-family: 'Nunito', sans-serif;
      font-size: 13px;
      outline: none;
      width: 100%;
      transition: border-color 0.2s;
    }

    .edit-input:focus {
      border-color: rgba(var(--border-rgb), 0.5);
    }

    .edit-textarea {
      resize: vertical;
      min-height: 64px;
    }

    .edit-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .edit-select-wrap {
      position: relative;
    }

    .edit-select {
      appearance: none;
      -webkit-appearance: none;
      padding-right: 32px;
      cursor: pointer;
    }

    .edit-select-icon {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: var(--text-sub);
      pointer-events: none;
    }

    .edit-input option {
      background: #0c1228;
      color: var(--text);
    }

    .edit-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-top: 2px;
    }

    .btn-edit-cancel {
      background: transparent;
      border: none;
      color: var(--text-sub);
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 9px 10px;
      letter-spacing: 0.04em;
      transition: color 0.2s;
    }

    .btn-edit-cancel:hover {
      color: var(--text);
    }

    /* ── Estado loading ── */
    .card-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-sub);
      font-size: 13px;
    }

    /* ── Error en card ── */
    .card-error {
      color: #ffb0b0;
      font-size: 12px;
      margin: 0;
      border: 1px solid rgba(255, 80, 80, 0.3);
      background: rgba(255, 80, 80, 0.08);
      border-radius: 6px;
      padding: 6px 8px;
    }

    /* ── Dropdown de espacio (sigue el patrón del sistema) ── */
    .card-space-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-space-dropdown-wrap {
      position: relative;
    }

    .card-space-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      text-align: left;
      cursor: pointer;
      background: rgba(var(--border-rgb), 0.03);
      border: 1.5px solid rgba(var(--border-rgb), 0.18);
      border-radius: var(--radius);
      color: var(--text-sub);
      padding: 0 12px;
      height: 40px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      transition: border-color 0.2s, color 0.2s;
    }

    .card-space-trigger:hover {
      border-color: rgba(var(--border-rgb), 0.4);
      color: var(--text);
    }

    .card-space-trigger.has-value {
      color: var(--text);
    }

    .card-space-trigger .chevron {
      margin-left: auto;
      font-size: 18px;
    }

    .card-space-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 20;
      background: var(--panel, var(--bg));
      border: 1.5px solid rgba(var(--border-rgb), 0.2);
      border-radius: 10px;
      padding: 6px;
      list-style: none;
      margin: 0;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      max-height: 200px;
      overflow-y: auto;
    }

    .card-space-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 7px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-sub);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .card-space-item:hover {
      background: rgba(var(--border-rgb), 0.08);
      color: var(--text);
    }

    .card-space-item.active {
      color: var(--primary);
      background: rgba(var(--primary-rgb), 0.08);
    }

    @media (max-width: 767px) {
      .content {
        padding: 20px 16px 84px;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .btn-generate {
        width: 100%;
        justify-content: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionsComponent {
  private readonly authService = inject(AuthService);
  private readonly membersService = inject(MembersService);
  private readonly suggestionService = inject(SuggestionService);
  private readonly suggestionState = inject(SuggestionStateService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly taskService = inject(TaskService);
  private readonly habitService = inject(HabitService);
  private readonly spaceService = inject(SpaceService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;
  readonly error = this.ls.error;

  readonly categoryOptions = SUGGESTION_CATEGORIES;
  readonly isParent = this.permissionsService.isParent;
  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);

  readonly members = signal<MemberItem[]>([]);
  readonly spaces = signal<SpaceResponse[]>([]);
  readonly localValidationError = signal('');
  readonly cardStates = signal<Map<string, CardState>>(new Map());
  readonly spacePickerOpenId = signal<string | null>(null);
  private hoverPrefetchTimer: ReturnType<typeof setTimeout> | null = null;
  private prefetchRequestVersion = 0;

  // Delegated to singleton service — survives navigation
  readonly selectedCategory = this.suggestionState.selectedCategory;
  readonly selectedMemberUserId = this.suggestionState.selectedMemberUserId;
  readonly suggestions = this.suggestionState.suggestions;
  readonly prefetchedSuggestions = this.suggestionState.prefetchedSuggestions;
  readonly isPrefetching = this.suggestionState.isPrefetching;
  readonly infoMessage = this.suggestionState.infoMessage;

  readonly selectableMembers = computed(() =>
    this.members().filter(m => m.role === 'CHILD')
  );

  constructor() {
    effect(() => {
      const familyId = this.familyId();
      if (!familyId) return;
      this.loadMembers(familyId);
      this.spaceService.getSpaces(familyId).subscribe({
        next: (s) => this.spaces.set(s),
        error: () => {},
      });
    });

    // On re-enter: if we have cached suggestions, kickstart prefetch silently
    effect(() => {
      const hasSuggestions = this.suggestions().length > 0;
      const noPrefetch = !this.isPrefetching() && !this.prefetchedSuggestions();
      if (hasSuggestions && noPrefetch) {
        this.startPrefetch();
      }
    }, { allowSignalWrites: true });
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set((target.value as SuggestionCategory) || '');
    this.localValidationError.set('');
    this.resetPrefetchState();
  }

  onMemberChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = Number(target.value);
    this.selectedMemberUserId.set(Number.isFinite(value) && value > 0 ? value : null);
    this.localValidationError.set('');
    this.resetPrefetchState();
  }

  generateSuggestions(): void {
    const familyId = this.familyId();
    const category = this.selectedCategory();
    const memberUserId = this.selectedMemberUserId();

    this.localValidationError.set('');
    this.infoMessage.set('');
    this.cardStates.set(new Map());
    this.spacePickerOpenId.set(null);
    this.resetPrefetchState();

    if (!category) {
      this.localValidationError.set('Selecciona una categoría para recibir sugerencias.');
      return;
    }
    if (!memberUserId) {
      this.localValidationError.set('Selecciona un miembro para recibir sugerencias.');
      return;
    }
    if (!familyId) {
      this.localValidationError.set('No se encontró una familia activa.');
      return;
    }

    const request: SuggestionRequest = { familyId, category, memberUserId };
    this.ls.run(this.suggestionService.getSuggestions(request), {
      next: (response) => {
        this.suggestions.set(response.sugerencias ?? []);
        this.infoMessage.set(response.mensaje ?? '');
        if ((response.sugerencias ?? []).length) {
          this.startPrefetch();
        }
      },
      error: () => {
        this.suggestions.set([]);
        this.infoMessage.set('');
      },
    });
  }

  getCardState(id: string): CardState {
    return this.cardStates().get(id) ?? { status: 'idle' };
  }

  getSelectedSpaceName(itemId: string): string {
    return this.getCardState(itemId).selectedSpaceName ?? 'Selecciona un espacio...';
  }

  toggleSpacePicker(itemId: string): void {
    this.spacePickerOpenId.update(id => id === itemId ? null : itemId);
  }

  onRefreshHoverEnter(): void {
    if ((this.prefetchedSuggestions()?.length ?? 0) > 0 || this.isPrefetching()) return;
    this.hoverPrefetchTimer = setTimeout(() => this.startPrefetch(), 100);
  }

  onRefreshHoverLeave(): void {
    if (!this.hoverPrefetchTimer) return;
    clearTimeout(this.hoverPrefetchTimer);
    this.hoverPrefetchTimer = null;
  }

  onRefreshTouchStart(): void {
    if ((this.prefetchedSuggestions()?.length ?? 0) === 0 && !this.isPrefetching()) {
      this.startPrefetch();
    }
  }

  loadPrefetched(): void {
    const next = this.prefetchedSuggestions();
    if (!next) return;

    this.suggestions.set(next);
    this.cardStates.set(new Map());
    this.spacePickerOpenId.set(null);
    this.prefetchedSuggestions.set(null);
    this.startPrefetch();
  }

  startEdit(item: SuggestionItem): void {
    this.updateCardState(item.id, {
      status: 'editing',
      editedNombre: item.nombre,
      editedDescripcion: item.descripcion,
      editedFrecuencia: item.frecuencia,
      editedComplejidad: item.complejidad,
      editedMonedas: item.monedas,
      editedExp: item.exp,
    });
  }

  onEditField(itemId: string, field: 'nombre' | 'descripcion' | 'frecuencia' | 'complejidad', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    const patch: Partial<CardState> = {};
    if (field === 'nombre') patch.editedNombre = value;
    else if (field === 'descripcion') patch.editedDescripcion = value;
    else if (field === 'frecuencia') patch.editedFrecuencia = value;
    else if (field === 'complejidad') patch.editedComplejidad = value;
    this.updateCardState(itemId, patch);
  }

  onEditNumericField(itemId: string, field: 'monedas' | 'exp', event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    const patch: Partial<CardState> = {};
    if (field === 'monedas') patch.editedMonedas = isNaN(value) ? 0 : value;
    else patch.editedExp = isNaN(value) ? 0 : value;
    this.updateCardState(itemId, patch);
  }

  cancelEdit(itemId: string): void {
    this.updateCardState(itemId, {
      status: 'idle',
      pendingItem: undefined,
      editedNombre: undefined,
      editedDescripcion: undefined,
      editedFrecuencia: undefined,
      editedComplejidad: undefined,
      editedMonedas: undefined,
      editedExp: undefined,
    });
  }

  confirmEdit(item: SuggestionItem): void {
    const state = this.getCardState(item.id);
    const editedItem: SuggestionItem = {
      ...item,
      nombre: state.editedNombre ?? item.nombre,
      descripcion: state.editedDescripcion ?? item.descripcion,
      frecuencia: state.editedFrecuencia ?? item.frecuencia,
      complejidad: state.editedComplejidad ?? item.complejidad,
      monedas: state.editedMonedas ?? item.monedas,
      exp: state.editedExp ?? item.exp,
    };
    // Update displayed card with edited values
    this.suggestions.update(list => list.map(s => s.id === item.id ? editedItem : s));
    // Store pendingItem for confirmAddTask/addAsHabit
    this.updateCardState(item.id, { pendingItem: editedItem });
    this.addSuggestion(editedItem);
  }

  addSuggestion(item: SuggestionItem): void {
    if (item.tipo === 'habito') {
      this.addAsHabit(item);
    } else {
      if (this.spaces().length === 0) {
        this.updateCardState(item.id, {
          status: 'error',
          errorMessage: 'No tienes espacios creados. Ve al Mapa del Hogar para crear uno primero.',
        });
        return;
      }
      this.updateCardState(item.id, { status: 'selecting-space' });
    }
  }

  selectSpace(itemId: string, spaceId: number, spaceName: string): void {
    this.updateCardState(itemId, { selectedSpaceId: spaceId, selectedSpaceName: spaceName });
    this.spacePickerOpenId.set(null);
  }

  confirmAddTask(item: SuggestionItem): void {
    const state = this.getCardState(item.id);
    const { selectedSpaceId } = state;
    const effectiveItem = state.pendingItem ?? item;
    const familyId = this.familyId();
    const assignedToId = this.selectedMemberUserId();
    if (!selectedSpaceId || !familyId || !assignedToId) return;

    this.updateCardState(item.id, { status: 'adding' });

    const priorityMap: Record<string, TaskPriority> = { Alta: 'HIGH', Media: 'MEDIUM', Baja: 'LOW' };
    const request: CreateTaskRequest = {
      familyId,
      homeSpaceId: selectedSpaceId,
      title: effectiveItem.nombre,
      description: effectiveItem.descripcion,
      priority: priorityMap[effectiveItem.complejidad] ?? 'MEDIUM',
      xpReward: effectiveItem.exp,
      coinsReward: effectiveItem.monedas,
      assignedToId,
    };

    this.taskService.create(request).subscribe({
      next: () => {
        this.updateCardState(item.id, { status: 'added' });
        this.snackBar.open('Tarea agregada correctamente', 'Cerrar', { duration: 4000 });
      },
      error: (err) => this.updateCardState(item.id, {
        status: 'error',
        errorMessage: err.error?.message ?? 'No se pudo crear la tarea. Intenta de nuevo.',
      }),
    });
  }

  formatTipo(tipo: string): string {
    return tipo?.toLowerCase() === 'habito' ? 'Hábito' : 'Tarea';
  }

  formatFrecuencia(frecuencia: string): string {
    return (
      {
        DAILY: 'Diaria',
        WEEKLY: 'Semanal',
        WEEKDAYS: 'Días hábiles',
        WEEKENDS: 'Fin de semana',
        MONTHLY: 'Mensual',
      }[frecuencia] ?? frecuencia
    );
  }

  private addAsHabit(item: SuggestionItem): void {
    const state = this.getCardState(item.id);
    const effectiveItem = state.pendingItem ?? item;
    const familyId = this.familyId();
    const assignedToId = this.selectedMemberUserId();
    if (!familyId || !assignedToId) return;

    this.updateCardState(item.id, { status: 'adding' });

    const request: CreateHabitRequest = {
      familyId,
      title: effectiveItem.nombre,
      description: effectiveItem.descripcion,
      frequency: effectiveItem.frecuencia as HabitFrequency,
      xpReward: effectiveItem.exp,
      coinsReward: effectiveItem.monedas,
    };

    this.habitService.create(request).subscribe({
      next: (habit) => this.habitService.assign(habit.id, { familyId, assignedToId }).subscribe({
        next: () => {
          this.updateCardState(item.id, { status: 'added' });
          this.snackBar.open('Hábito agregado y asignado', 'Cerrar', { duration: 4000 });
        },
        error: (err) => this.updateCardState(item.id, {
          status: 'error',
          errorMessage: err.error?.message ?? 'Hábito creado pero no se pudo asignar.',
        }),
      }),
      error: (err) => this.updateCardState(item.id, {
        status: 'error',
        errorMessage: err.error?.message ?? 'No se pudo crear el hábito. Intenta de nuevo.',
      }),
    });
  }

  private updateCardState(id: string, patch: Partial<CardState>): void {
    this.cardStates.update(m => {
      const next = new Map(m);
      next.set(id, { ...(next.get(id) ?? { status: 'idle' }), ...patch });
      return next;
    });
  }

  private resetPrefetchState(): void {
    this.prefetchRequestVersion += 1;
    this.suggestionState.resetPrefetch();
    if (this.hoverPrefetchTimer) {
      clearTimeout(this.hoverPrefetchTimer);
      this.hoverPrefetchTimer = null;
    }
  }

  private startPrefetch(): void {
    const familyId = this.familyId();
    const category = this.selectedCategory();
    const memberUserId = this.selectedMemberUserId();

    if (!familyId || !category || !memberUserId || this.isPrefetching()) return;

    const requestVersion = ++this.prefetchRequestVersion;
    this.isPrefetching.set(true);
    this.prefetchedSuggestions.set(null);
    this.onRefreshHoverLeave();

    this.suggestionService.getSuggestions({
      familyId,
      category: category as string,
      memberUserId,
      excludedSuggestionNames: this.suggestions().map(item => item.nombre),
    }).subscribe({
      next: (response) => {
        if (requestVersion !== this.prefetchRequestVersion) return;
        const nextSuggestions = response.sugerencias ?? [];
        this.prefetchedSuggestions.set(nextSuggestions.length ? nextSuggestions : null);
        this.isPrefetching.set(false);
      },
      error: () => {
        if (requestVersion !== this.prefetchRequestVersion) return;
        this.isPrefetching.set(false);
      },
    });
  }

  private loadMembers(familyId: number): void {
    this.membersService.getMembers(familyId).subscribe({
      next: (response) => {
        this.members.set(response.members ?? []);
      },
      error: () => {
        this.members.set([]);
      },
    });
  }
}
