import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Role {
  num: string;
  role: string;
  name: string;
}

@Component({
  selector: 'vx-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vx-section">
      <div class="vx-section-inner">
        <div class="vx-section-head">
          <span class="vx-eyebrow">C\u00d3MO TRABAJAMOS</span>
          <h2 class="vx-heading">
            Roles & <span class="vx-accent">funciones</span>
          </h2>
          <p class="vx-sub">
            Cada integrante lidera un \u00e1rea especializada.
            Juntos cubrimos el ciclo completo del desarrollo.
          </p>
        </div>

        <div class="vx-roles-grid">
          @for (r of roles; track r.num) {
            <article class="vx-role-card">
              <div class="vx-role-head">
                <span class="vx-role-num">{{ r.num }}</span>
                <span class="vx-role-title">{{ r.role }}</span>
              </div>
              <h3 class="vx-role-name">{{ r.name }}</h3>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .vx-section { padding: 80px 0; border-top: 1px solid var(--vx-border); }
    .vx-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .vx-section-head { margin-bottom: 48px; max-width: 640px; }
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
    }

    .vx-roles-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 700px) { .vx-roles-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1000px) { .vx-roles-grid { grid-template-columns: repeat(3, 1fr); } }

    .vx-role-card {
      position: relative;
      padding: 28px 24px;
      background: var(--vx-surface);
      border: 1px solid var(--vx-border);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.25s, transform 0.25s;
    }
    .vx-role-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, var(--vx-accent-glow), transparent 60%);
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .vx-role-card:hover {
      border-color: var(--vx-accent-2);
      transform: translateY(-3px);
    }
    .vx-role-card:hover::before { opacity: 0.3; }

    .vx-role-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      position: relative;
    }
    .vx-role-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--vx-accent-2);
      background: rgba(0, 72, 255, 0.12);
      border: 1px solid rgba(0, 72, 255, 0.3);
      padding: 4px 8px;
      border-radius: 6px;
      letter-spacing: 1px;
    }
    .vx-role-title {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--vx-text-muted);
      font-weight: 600;
    }
    .vx-role-name {
      font-size: 18px;
      font-weight: 700;
      color: var(--vx-text);
      margin: 0 0 20px;
      line-height: 1.3;
      position: relative;
    }
    .vx-role-focus {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      position: relative;
    }
    .vx-chip {
      display: inline-block;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 500;
      color: var(--vx-text-dim);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--vx-border);
      border-radius: 6px;
      transition: color 0.2s, border-color 0.2s;
    }
    .vx-role-card:hover .vx-chip {
      color: var(--vx-text);
      border-color: var(--vx-border-strong);
    }
  `],
})
export class VxRolesComponent {
  readonly roles: Role[] = [
    { num: '01', role: 'General Lead', name: 'Katherine Segura G\u00f3mez' },
    { num: '02', role: 'Dev Lead', name: 'Luis Diego Hidalgo Ag\u00fcero' },
    { num: '03', role: 'Dev Lead', name: 'Fabricio Vargas Jim\u00e9nez' },
    { num: '04', role: 'QA Lead', name: 'Antonio Mora Blotta' },
    { num: '05', role: 'Support Lead', name: 'Jos\u00e9 Andr\u00e9s Picado Corrales' },
  ];
}
