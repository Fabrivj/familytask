import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Renders a circular avatar with the user's initial and the neon gradient.
 * Replaces the repeated .avatar div pattern across feature components.
 *
 * Usage:
 *   <app-user-avatar [name]="shortName()" [size]="26" />
 */
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.font-size.px]="size() * 0.43"
      aria-hidden="true"
    >{{ initial() }}</span>
  `,
  styles: [`
    :host { display: contents; }
    span {
      border-radius: 50%;
      background: linear-gradient(135deg, var(--secondary), var(--border));
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
  `],
})
export class UserAvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(32);
  readonly initial = computed(() => (this.name()[0] ?? '?').toUpperCase());
}
