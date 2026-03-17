import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardCornersComponent } from '../card-corners/card-corners.component';

/**
 * The standard neon card shell used across all feature views.
 * Provides the card container, header section, body section, and CTA area.
 *
 * Usage:
 *   <app-neon-card>
 *     <ng-container card-header>
 *       <p class="tag">// PASO 1</p>
 *       <h1 class="card-title">Título</h1>
 *       <p class="card-sub">Subtítulo</p>
 *     </ng-container>
 *
 *     <!-- body content (default slot) -->
 *     <mat-form-field>...</mat-form-field>
 *
 *     <!-- CTA button -->
 *     <button card-cta class="btn-cta">Continuar</button>
 *   </app-neon-card>
 *
 * Slots:
 *   [card-header]  — content inside the gradient header section
 *   (default)      — content inside the body section
 *   [card-cta]     — content inside the bottom CTA area
 */
@Component({
  selector: 'app-neon-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardCornersComponent],
  templateUrl: './neon-card.component.html',
  styleUrl: './neon-card.component.css',
})
export class NeonCardComponent {
  /** Center the body content vertically (for loading/success states with spinner) */
  readonly centered = input(false);
}
