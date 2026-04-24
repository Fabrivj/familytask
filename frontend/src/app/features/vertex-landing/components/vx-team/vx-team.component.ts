import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Member {
  initials: string;
  name: string;
  role: string;
}

@Component({
  selector: 'vx-team',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vx-section">
      <div class="vx-section-inner">
        <div class="vx-section-head">
          <div class="vx-section-head-title">
            <span class="vx-eyebrow">EL EQUIPO</span>
            <h2 class="vx-heading">
              Las personas detr\u00e1s<br />del <span class="vx-accent">c\u00f3digo</span>
            </h2>
          </div>
          <p class="vx-sub">
            Cinco ingenieros con roles especializados, trabajando en conjunto
            para entregar software que funciona.
          </p>
        </div>

        <div class="vx-team-grid">
          @for (m of members; track m.initials; let i = $index) {
            <article class="vx-member">
              <span class="vx-member-num">0{{ i + 1 }}</span>
              <div class="vx-avatar">{{ m.initials }}</div>
              <h3 class="vx-member-name">{{ m.name }}</h3>
              <span class="vx-member-role">{{ m.role }}</span>
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
    .vx-section-head { display: grid; gap: 16px; margin-bottom: 48px; }
    @media (min-width: 900px) {
      .vx-section-head { grid-template-columns: 1.3fr 1fr; align-items: end; }
    }
    .vx-eyebrow {
      display: inline-block; color: var(--vx-accent-2);
      font-size: 11px; font-weight: 600; letter-spacing: 2px;
    }
    .vx-heading {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 800; line-height: 1.1; margin: 0;
      letter-spacing: -0.02em;
    }
    .vx-accent { color: var(--vx-accent-2); }
    .vx-sub {
      color: var(--vx-text-dim);
      font-size: 14px; line-height: 1.7; margin: 0;
      max-width: 360px; justify-self: end;
    }
    .vx-team-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    @media (min-width: 600px) { .vx-team-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 900px) { .vx-team-grid { grid-template-columns: repeat(5, 1fr); gap: 16px; } }
    .vx-member {
      padding: 24px 20px;
      border: 1px solid var(--vx-border);
      border-radius: 12px;
      background: var(--vx-surface);
      position: relative;
      transition: border-color 0.2s, transform 0.2s;
    }
    .vx-member:hover { border-color: var(--vx-accent-2); transform: translateY(-4px); }
    .vx-member-num {
      position: absolute; top: 16px; right: 16px;
      font-size: 10px; color: var(--vx-text-muted); letter-spacing: 2px;
    }
    .vx-avatar {
      width: 56px; height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--vx-accent), var(--vx-accent-2));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #fff;
      margin-bottom: 20px;
      box-shadow: 0 8px 20px var(--vx-accent-glow);
    }
    .vx-member-name {
      font-size: 14px; font-weight: 600;
      margin: 0 0 8px; color: var(--vx-text);
      line-height: 1.3;
    }
    .vx-member-role {
      display: inline-block;
      font-size: 9px; letter-spacing: 2px;
      padding: 4px 8px;
      background: rgba(0, 72, 255, 0.12);
      border: 1px solid rgba(0, 72, 255, 0.3);
      color: var(--vx-accent-2);
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .vx-member-sep {
      display: block;
      margin-top: 20px;
      height: 1px;
      background: var(--vx-border);
    }
  `],
})
export class VxTeamComponent {
  readonly members: Member[] = [
    { initials: 'KS', name: 'Katherine Segura G\u00f3mez', role: 'General Lead' },
    { initials: 'LD', name: 'Luis Diego Hidalgo Ag\u00fcero', role: 'Dev Lead' },
    { initials: 'FV', name: 'Fabricio Vargas Jim\u00e9nez', role: 'Dev Lead' },
    { initials: 'AM', name: 'Antonio Mora Blotta', role: 'QA Lead' },
    { initials: 'JP', name: 'Jos\u00e9 Andr\u00e9s Picado Corrales', role: 'Support Lead' },
  ];
}
