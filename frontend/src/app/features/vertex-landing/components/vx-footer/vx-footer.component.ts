import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'vx-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="vx-footer">
      <div class="vx-footer-inner">
        <a href="#" class="vx-brand" (click)="scrollTop($event)">
          <svg class="vx-brand-img" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Vertex Dev">
            <defs>
              <linearGradient id="vxFL1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6BA6FF"/>
                <stop offset="100%" stop-color="#0A2C7A"/>
              </linearGradient>
              <linearGradient id="vxFL2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2563EB"/>
                <stop offset="100%" stop-color="#0038CC"/>
              </linearGradient>
            </defs>
            <path d="M6 10 L32 52 L24 26 Z" fill="url(#vxFL1)"/>
            <path d="M32 52 L58 10 L40 26 Z" fill="url(#vxFL2)"/>
            <path d="M24 26 L32 52 L40 26 L32 18 Z" fill="#0048FF"/>
          </svg>
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
  scrollTop(e: Event) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
