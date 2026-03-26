import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Informational hint chip displayed below cards.
 * Replaces the pattern:
 *   <div class="help-row">
 *     <div class="help-chip">
 *       <svg><!-- info icon --></svg>
 *       message text
 *     </div>
 *   </div>
 *
 * Usage:
 *   <app-help-chip>Podrás invitar más miembros desde configuración.</app-help-chip>
 */
@Component({
  selector: 'app-help-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <div class="chip">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M8 7.5v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          <circle cx="8" cy="5.2" r="0.8" fill="currentColor"/>
        </svg>
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .row {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 16px;
    }

    .chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(var(--border-rgb), 0.03);
      border: 1px solid rgba(var(--border-rgb), 0.13);
      border-radius: 20px;
      padding: 7px 16px;
      font-size: 11px;
      color: var(--text-sub);
      text-align: center;
      line-height: 1.5;
    }

    .chip svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
      color: var(--text-sub);
    }
  `],
})
export class HelpChipComponent {}
