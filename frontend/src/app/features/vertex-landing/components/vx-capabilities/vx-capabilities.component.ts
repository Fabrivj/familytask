import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Capability {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'vx-capabilities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vx-section">
      <div class="vx-section-inner">
        <div class="vx-section-head">
          <span class="vx-eyebrow">QU\u00c9 HACEMOS</span>
          <h2 class="vx-heading">
            Nuestras <span class="vx-accent">capacidades</span>
          </h2>
          <p class="vx-sub">
            Cubrimos todo el ciclo de vida del software, desde la arquitectura
            hasta el despliegue, con est\u00e1ndares de calidad en cada etapa del proceso.
          </p>
        </div>

        <div class="vx-grid">
          @for (cap of caps; track cap.title) {
            <article class="vx-card">
              <div class="vx-card-icon">
                <span [innerHTML]="cap.icon"></span>
              </div>
              <h3 class="vx-card-title">{{ cap.title }}</h3>
              <p class="vx-card-desc">{{ cap.desc }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .vx-section { padding: 80px 0; border-top: 1px solid var(--vx-border); }
    .vx-section-inner {
      max-width: 1200px; margin: 0 auto; padding: 0 24px;
      display: grid; gap: 40px;
    }
    @media (min-width: 900px) {
      .vx-section-inner { grid-template-columns: 1fr 1.8fr; gap: 64px; align-items: start; }
    }
    .vx-eyebrow {
      display: inline-block; color: var(--vx-accent-2);
      font-size: 11px; font-weight: 600; letter-spacing: 2px;
      margin-bottom: 16px;
    }
    .vx-heading {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 800; line-height: 1.1; margin: 0 0 16px;
      letter-spacing: -0.02em;
    }
    .vx-accent { color: var(--vx-accent-2); }
    .vx-sub {
      color: var(--vx-text-dim);
      font-size: 14px; line-height: 1.7; margin: 0;
      max-width: 340px;
    }
    .vx-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1px;
      background: var(--vx-border);
      border: 1px solid var(--vx-border);
      border-radius: 12px;
      overflow: hidden;
    }
    @media (min-width: 600px) { .vx-grid { grid-template-columns: 1fr 1fr; } }
    .vx-card {
      background: var(--vx-surface);
      padding: 28px;
      transition: background 0.2s;
    }
    .vx-card:hover { background: var(--vx-surface-2); }
    .vx-card-icon {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      color: var(--vx-accent-2);
      margin-bottom: 20px;
    }
    .vx-card-icon svg { width: 100%; height: 100%; }
    ::ng-deep .vx-card-icon svg { width: 100%; height: 100%; }
    .vx-card-title {
      font-size: 12px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0 0 10px;
      color: var(--vx-text);
    }
    .vx-card-desc {
      font-size: 13px; line-height: 1.6;
      color: var(--vx-text-dim); margin: 0;
    }
  `],
})
export class VxCapabilitiesComponent {
  readonly caps: Capability[] = [
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14l2 2 4-4"/></svg>',
      title: 'BACKEND DEVELOPMENT',
      desc: 'APIs robustas, arquitecturas escalables y l\u00f3gica de negocio s\u00f3lida. Enfoque en rendimiento, seguridad y mantenibilidad a largo plazo.',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M7 14h4"/></svg>',
      title: 'FRONTEND ENGINEERING',
      desc: 'Interfaces modernas y accesibles con experiencia de usuario optimizada. C\u00f3digo limpio y componentes reutilizables.',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
      title: 'DATABASE ARCHITECTURE',
      desc: 'Dise\u00f1o de esquemas eficientes, optimizaci\u00f3n de queries y estrategias de almacenamiento adaptadas a cada proyecto.',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0z"/><path d="M12 8v4l3 2"/></svg>',
      title: 'CI/CD & DEVOPS',
      desc: 'Pipelines de integraci\u00f3n continua, gesti\u00f3n de repositorios y branching strategies para equipos de desarrollo.',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 6 9 17l-5-5"/></svg>',
      title: 'QUALITY ASSURANCE',
      desc: 'Testing manual, automatizado y de rendimiento. Gesti\u00f3n de defectos y cobertura de pruebas garantizada en cada sprint.',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3zM12 12 3 7.5M12 12l9-4.5M12 12v9"/></svg>',
      title: 'TECHNICAL LEADERSHIP',
      desc: 'Code reviews, definici\u00f3n de est\u00e1ndares, decisiones de arquitectura y mentor\u00eda t\u00e9cnica al equipo de desarrollo.',
    },
  ];
}
