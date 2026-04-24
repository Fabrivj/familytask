import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'vx-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="vx-footer">
      <div class="vx-footer-inner">
        <a href="#inicio" class="vx-brand">
          <img src="vertex/logo.png" alt="Vertex Dev" class="vx-brand-img" onerror="this.style.display='none'" />
          <span>VERTEX <span class="vx-accent">DEV</span></span>
        </a>
        <p class="vx-copy">{{ year }} Vertex Dev \u2014 Engineering Team</p>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    .vx-footer {
      border-top: 1px solid var(--vx-border);
      padding: 32px 0;
      margin-top: 40px;
    }
    .vx-footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      justify-content: space-between;
      align-items: center;
    }
    @media (min-width: 600px) { .vx-footer-inner { flex-direction: row; } }
    .vx-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: var(--vx-text);
      font-weight: 700; letter-spacing: 0.5px; font-size: 14px;
    }
    .vx-brand-img { width: 24px; height: 24px; object-fit: contain; }
    .vx-accent { color: var(--vx-accent-2); }
    .vx-copy {
      font-size: 11px;
      color: var(--vx-text-muted);
      letter-spacing: 1px;
      margin: 0;
    }
  `],
})
export class VxFooterComponent {
  readonly year = new Date().getFullYear();
}
