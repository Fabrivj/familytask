import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'vx-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="vx-nav">
      <div class="vx-nav-inner">
        <a class="vx-brand" href="#inicio" (click)="closeMenu()">
          <img src="vertex/logo.png" alt="Vertex Dev" class="vx-brand-img" onerror="this.style.display='none'" />
          <span class="vx-brand-text">VERTEX <span>DEV</span></span>
        </a>

        <nav class="vx-links" [class.open]="open()">
          <a href="#servicios" (click)="closeMenu()">Servicios</a>
          <a href="#equipo" (click)="closeMenu()">Equipo</a>
          <a href="#nosotros" (click)="closeMenu()">Nosotros</a>
          <a href="#roles" (click)="closeMenu()">Roles</a>
          <a href="#equipo" class="vx-cta-mobile" (click)="closeMenu()">Trabajemos juntos</a>
        </nav>

        <a href="#equipo" class="vx-cta">Trabajemos juntos</a>

        <button class="vx-burger" (click)="toggle()" aria-label="Men\u00fa" [attr.aria-expanded]="open()">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; position: sticky; top: 0; z-index: 40; }
    .vx-nav {
      backdrop-filter: blur(12px);
      background: rgba(5, 6, 10, 0.75);
      border-bottom: 1px solid var(--vx-border);
    }
    .vx-nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .vx-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: var(--vx-text);
      font-weight: 700; letter-spacing: 0.5px;
    }
    .vx-brand-img { width: 28px; height: 28px; object-fit: contain; }
    .vx-brand-text { font-size: 14px; }
    .vx-brand-text span { color: var(--vx-accent-2); }
    .vx-links {
      display: flex; align-items: center; gap: 28px;
    }
    .vx-links a {
      color: var(--vx-text-dim);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: color 0.2s;
    }
    .vx-links a:hover { color: var(--vx-text); }
    .vx-cta-mobile { display: none; }
    .vx-cta {
      background: var(--vx-accent);
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--vx-accent);
      transition: background 0.2s, transform 0.2s;
    }
    .vx-cta:hover { background: #0038cc; transform: translateY(-1px); }
    .vx-burger {
      display: none;
      background: none; border: none; cursor: pointer;
      width: 36px; height: 36px;
      flex-direction: column; justify-content: center; gap: 5px; padding: 8px;
    }
    .vx-burger span {
      display: block;
      height: 2px; width: 100%;
      background: var(--vx-text);
      border-radius: 2px;
    }

    @media (max-width: 900px) {
      .vx-cta { display: none; }
      .vx-burger { display: flex; }
      .vx-links {
        position: absolute;
        top: 100%; left: 0; right: 0;
        flex-direction: column;
        background: rgba(5, 6, 10, 0.98);
        border-bottom: 1px solid var(--vx-border);
        padding: 20px 24px;
        gap: 16px;
        transform: translateY(-10px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s, transform 0.2s;
      }
      .vx-links.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      .vx-cta-mobile {
        display: inline-block;
        background: var(--vx-accent);
        color: #fff !important;
        padding: 12px 16px;
        border-radius: 8px;
        text-align: center;
      }
    }
  `],
})
export class VxNavbarComponent {
  readonly open = signal(false);
  toggle() { this.open.update(v => !v); }
  closeMenu() { this.open.set(false); }
}
