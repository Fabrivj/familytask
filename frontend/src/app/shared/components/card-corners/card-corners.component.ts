import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Renders the two neon corner bracket accents used on all neon cards.
 * Drop inside any `position: relative` card container:
 *
 *   <div class="card">
 *     <app-card-corners />
 *     <!-- card content -->
 *   </div>
 */
@Component({
  selector: 'app-card-corners',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>
  `,
  styles: [`
    .corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: var(--primary);
      border-style: solid;
    }
    .corner.tl { top:-1px; left:-1px; border-width:3px 0 0 3px; border-radius:16px 0 0 0; }
    .corner.br { bottom:-1px; right:-1px; border-width:0 3px 3px 0; border-radius:0 0 16px 0; }
  `],
})
export class CardCornersComponent {}
