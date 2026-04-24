import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Pillar {
  num: string;
  title: string;
  body: string;
}

@Component({
  selector: 'vx-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vx-section">
      <div class="vx-section-inner">
        <div class="vx-section-head">
          <span class="vx-eyebrow">QUI\u00c9NES SOMOS</span>
          <h2 class="vx-heading">
            Lo que nos define<br />como <span class="vx-accent">equipo</span>
          </h2>
        </div>

        <div class="vx-pillars">
          @for (p of pillars; track p.num) {
            <article class="vx-pillar">
              <span class="vx-pillar-num">{{ p.num }}</span>
              <span class="vx-pillar-bar"></span>
              <h3 class="vx-pillar-title">{{ p.title }}</h3>
              <p class="vx-pillar-body">{{ p.body }}</p>
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
    .vx-section-head { margin-bottom: 48px; }
    .vx-eyebrow {
      display: inline-block; color: var(--vx-accent-2);
      font-size: 11px; font-weight: 600; letter-spacing: 2px;
      margin-bottom: 16px;
    }
    .vx-heading {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 800; line-height: 1.1; margin: 0;
      letter-spacing: -0.02em;
    }
    .vx-accent { color: var(--vx-accent-2); }
    .vx-pillars {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 900px) { .vx-pillars { grid-template-columns: repeat(3, 1fr); } }
    .vx-pillar {
      position: relative;
      padding: 32px 28px;
      background: var(--vx-surface);
      border: 1px solid var(--vx-border);
      border-radius: 12px;
      overflow: hidden;
    }
    .vx-pillar-num {
      position: absolute;
      top: 12px; right: 20px;
      font-size: clamp(48px, 8vw, 88px);
      font-weight: 800;
      color: rgba(255,255,255,0.04);
      line-height: 1;
      pointer-events: none;
    }
    .vx-pillar-bar {
      display: block;
      width: 40px; height: 2px;
      background: var(--vx-accent-2);
      margin-bottom: 20px;
    }
    .vx-pillar-title {
      font-size: 13px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0 0 16px;
    }
    .vx-pillar-body {
      font-size: 13px; line-height: 1.7;
      color: var(--vx-text-dim); margin: 0;
      max-width: 280px;
      position: relative;
    }
  `],
})
export class VxIdentityComponent {
  readonly pillars: Pillar[] = [
    {
      num: '01',
      title: 'MISI\u00d3N',
      body: 'Construir soluciones de software innovadoras, confiables y escalables que transformen ideas en productos digitales de alto impacto, impulsando la eficiencia y competitividad de quienes conf\u00edan en nuestro trabajo.',
    },
    {
      num: '02',
      title: 'VISI\u00d3N',
      body: 'Ser un referente en desarrollo de software de calidad, aplicando tecnolog\u00edas modernas y buenas pr\u00e1cticas de ingenier\u00eda. El xito como equipo t\u00e9cnico, fomentando la innovaci\u00f3n y el trabajo colaborativo en cada proyecto.',
    },
    {
      num: '03',
      title: 'VALORES',
      body: 'Respeto, empat\u00eda y compromiso definen nuestra cultura. La responsabilidad individual y la comunicaci\u00f3n clara son los pilares que sostienen nuestra capacidad de entregar con calidad y consistencia.',
    },
  ];
}
