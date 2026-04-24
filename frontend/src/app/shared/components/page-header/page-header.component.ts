import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page-level heading section used across all dashboard and full-width views.
 * Renders a monospace tag line, a main title, and an optional subtitle.
 *
 * Usage:
 *   <app-page-header tag="// DASHBOARD" title="Bienvenido, Antonio" />
 *   <app-page-header tag="// MIEMBROS" title="Tu familia" subtitle="Gestiona quién pertenece al grupo." />
 *   <app-page-header tag="// ..." title="..." [centered]="true" />
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.centered]': 'centered()',
  },
  template: `
    <div class="inner">
      <div class="text">
        @if (tag()) { <p class="tag">{{ tag() }}</p> }
        <h1 class="title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <ng-content />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 40px;
    }

    :host.centered {
      text-align: center;
    }

    .inner {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      color: var(--primary);
      text-transform: uppercase;
      margin: 0 0 10px;
    }

    .title {
      font-family: 'Rajdhani', sans-serif;
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.02em;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: var(--text-sub);
      margin: 8px 0 0;
    }

    @media (max-width: 767px) {
      :host {
        margin-bottom: 20px;
      }
      .tag { margin-bottom: 6px; }
      .subtitle { font-size: 13px; }
    }
  `],
})
export class PageHeaderComponent {
  readonly tag = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly centered = input<boolean>(false);
}
