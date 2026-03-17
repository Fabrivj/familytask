import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Inline pill badge showing a family role.
 * Standardizes label text and color across all views.
 *
 * Usage:
 *   <app-role-badge [role]="familia.role" />
 */
@Component({
  selector: 'app-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class.parent]="role() === 'PARENT'">
      {{ role() === 'PARENT' ? 'Padre / Tutor' : 'Hijo / a' }}
    </span>
  `,
  styles: [`
    .badge {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.08em;
      padding: 3px 12px;
      border-radius: 20px;
      border: 1px solid rgba(var(--border-rgb), 0.33);
      color: var(--border);
      background: rgba(var(--border-rgb), 0.05);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .badge.parent {
      border-color: rgba(var(--primary-rgb), 0.33);
      color: var(--primary);
      background: rgba(var(--primary-rgb), 0.05);
    }
  `],
})
export class RoleBadgeComponent {
  readonly role = input.required<'PARENT' | 'CHILD'>();
}
