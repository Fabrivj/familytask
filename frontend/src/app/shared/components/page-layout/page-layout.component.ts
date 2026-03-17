import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Full-height centered page wrapper with the neon dot-grid background
 * and scanlines overlay. Replaces the repeated pattern:
 *   <div class="page-container scanlines"><div class="page">
 *
 * Usage:
 *   <app-page-layout>
 *     <app-top-bar [userName]="..." />
 *     <app-neon-card>...</app-neon-card>
 *   </app-page-layout>
 */
@Component({
  selector: 'app-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.css',
})
export class PageLayoutComponent {
  /** 'card' — centered narrow layout (default, for single-card pages).
   *  'full' — full-width column layout (for dashboard-style pages). */
  readonly variant = input<'card' | 'full'>('card');
}
