import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'vx-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vx-hero">
      <div class="vx-hero-inner">
        <div class="vx-hero-copy">
          <span class="vx-eyebrow">SOFTWARE ENGINEERING TEAM</span>
          <h1 class="vx-title">
            C\u00f3digo que <span class="vx-title-accent">escala.</span><br />
            Productos que impactan.
          </h1>
          <p class="vx-lead">
            Dise\u00f1amos y construimos soluciones digitales de alta calidad.
            Arquitectura s\u00f3lida, metodolog\u00edas \u00e1giles y un equipo
            comprometido con cada l\u00ednea de c\u00f3digo.
          </p>
          <div class="vx-hero-ctas">
            <a href="#" class="vx-btn vx-btn-primary" (click)="scroll($event, 'equipo')">Conocer el equipo</a>
            <a href="#" class="vx-btn vx-btn-ghost" (click)="scroll($event, 'nosotros')">Por qu\u00e9 hacemos</a>
          </div>
        </div>

        <div class="vx-hero-visual" aria-hidden="true">
          <div class="vx-orbit">
             <img class="vx-logo" src="/icons/vertex-logo.png" alt="Logo" />
            <div class="vx-ring"></div>
            <div class="vx-ring vx-ring-2"></div>
            <span class="vx-dot vx-dot-1"></span>
            <span class="vx-dot vx-dot-2"></span>
            <span class="vx-dot vx-dot-3"></span>
          </div>
        </div>
      </div>

      <div class="vx-stats">
        <div class="vx-stat">
          <span class="vx-stat-value">5+</span>
          <span class="vx-stat-label">Personas</span>
        </div>
        <div class="vx-stat">
          <span class="vx-stat-value">\u221e</span>
          <span class="vx-stat-label">Compromiso</span>
        </div>
        <div class="vx-stat">
          <span class="vx-stat-value">100%</span>
          <span class="vx-stat-label">Dedicaci\u00f3n</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .vx-hero {
      max-width: 1200px;
      margin: 0 auto;
      padding: clamp(40px, 8vw, 96px) 24px 48px;
    }
    .vx-hero-inner {
      display: grid;
      grid-template-columns: 1fr;
      gap: 48px;
      align-items: center;
    }
    @media (min-width: 900px) {
      .vx-hero-inner { grid-template-columns: 1.3fr 1fr; gap: 64px; }
    }
    .vx-eyebrow {
      display: inline-block;
      color: var(--vx-accent-2);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    .vx-title {
      font-size: clamp(36px, 6.5vw, 68px);
      line-height: 1.05;
      font-weight: 800;
      margin: 0 0 24px;
      letter-spacing: -0.02em;
    }
    .vx-title-accent {
      color: var(--vx-accent-2);
      font-style: italic;
      font-weight: 700;
    }
    .vx-lead {
      color: var(--vx-text-dim);
      max-width: 520px;
      font-size: clamp(14px, 1.5vw, 16px);
      line-height: 1.7;
      margin: 0 0 32px;
    }
    .vx-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
    .vx-btn {
      padding: 12px 22px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, background 0.2s;
      display: inline-block;
    }
    .vx-btn-primary {
      background: var(--vx-accent);
      color: #fff;
      box-shadow: 0 8px 24px var(--vx-accent-glow);
    }
    .vx-btn-primary:hover { transform: translateY(-2px); background: #0038cc; }
    .vx-btn-ghost {
      background: transparent;
      color: var(--vx-text-dim);
      border: 1px solid var(--vx-border-strong);
    }
    .vx-btn-ghost:hover { color: var(--vx-text); border-color: var(--vx-accent-2); }

    .vx-hero-visual {
      display: flex; justify-content: center; align-items: center;
      min-height: 280px;
    }
    .vx-orbit {
      position: relative;
      width: min(360px, 80vw);
      aspect-ratio: 1;
      display: flex; align-items: center; justify-content: center;
    }
    .vx-logo {
      width: 75%;
  object-fit: contain;
  filter: drop-shadow(0 0 40px var(--vx-accent-glow));
  z-index: 2;
    }
    .vx-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px solid var(--vx-border);
    }
    .vx-ring-2 { inset: 15%; border-color: rgba(59, 130, 246, 0.2); }
    .vx-dot {
      position: absolute;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--vx-accent-2);
      box-shadow: 0 0 16px var(--vx-accent-2);
    }
    .vx-dot-1 { top: 0; left: 50%; transform: translateX(-50%); }
    .vx-dot-2 { top: 20%; right: 8%; }
    .vx-dot-3 { top: 40%; left: 4%; }

    .vx-stats {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px 80px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      text-align: center;
    }
    @media (min-width: 900px) {
      .vx-stats {
        max-width: 440px;
        margin-left: auto;
        margin-right: 24px;
        margin-top: -40px;
        padding-bottom: 40px;
      }
    }
    .vx-stat {
      padding: 16px;
      border-top: 1px solid var(--vx-border);
    }
    .vx-stat-value {
      display: block;
      font-size: clamp(22px, 3vw, 28px);
      font-weight: 700;
      color: var(--vx-accent-2);
      line-height: 1;
      margin-bottom: 6px;
    }
    .vx-stat-label {
      display: block;
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--vx-text-muted);
      text-transform: uppercase;
    }
  `],
})
export class VxHeroComponent {
  scroll(e: Event, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
