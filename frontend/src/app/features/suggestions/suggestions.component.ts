import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';
import { MembersService } from '@core/services/members.service';
import { PermissionsService } from '@core/services/permissions.service';
import { SuggestionService } from '@core/services/suggestion.service';
import {
  SuggestionCategory,
  SuggestionItem,
  SuggestionRequest,
  SUGGESTION_CATEGORIES,
} from '@core/models/suggestion.model';
import { MemberItem } from '@core/models/member.model';
import { injectLoadingState } from '@core/utils/loading-state';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-suggestions',
  imports: [AppShellComponent, PageHeaderComponent, MatIconModule, MatProgressSpinnerModule],
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
                  <span class="reward">+{{ item.puntos }} pts</span>
                  <span class="reward">+{{ item.exp }} EXP</span>
                </div>

                <p class="motivator">{{ item.mensajeMotivador }}</p>
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
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(0, 239, 255, 0.2);
      border-radius: 10px;
      color: var(--text);
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
    }

    .field-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(0, 239, 255, 0.15);
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
  private readonly permissionsService = inject(PermissionsService);

  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;
  readonly error = this.ls.error;

  readonly categoryOptions = SUGGESTION_CATEGORIES;
  readonly isParent = this.permissionsService.isParent;
  readonly familyId = computed(() => this.authService.activeFamily()?.familyId ?? null);

  readonly members = signal<MemberItem[]>([]);
  readonly selectedCategory = signal<SuggestionCategory | ''>('');
  readonly selectedMemberUserId = signal<number | null>(null);
  readonly suggestions = signal<SuggestionItem[]>([]);
  readonly infoMessage = signal('');
  readonly localValidationError = signal('');

  readonly selectableMembers = computed(() =>
    this.members().filter(m => m.role === 'CHILD')
  );

  constructor() {
    effect(() => {
      const familyId = this.familyId();
      if (!familyId) return;
      this.loadMembers(familyId);
    });
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set((target.value as SuggestionCategory) || '');
    this.localValidationError.set('');
  }

  onMemberChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = Number(target.value);
    this.selectedMemberUserId.set(Number.isFinite(value) && value > 0 ? value : null);
    this.localValidationError.set('');
  }

  generateSuggestions(): void {
    const familyId = this.familyId();
    const category = this.selectedCategory();
    const memberUserId = this.selectedMemberUserId();

    this.localValidationError.set('');
    this.infoMessage.set('');

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
      },
      error: () => {
        this.suggestions.set([]);
        this.infoMessage.set('');
      },
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
