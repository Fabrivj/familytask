import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Renders a circular avatar — either a photo (if pictureUrl is given)
 * or the user's initial with the neon gradient.
 *
 * Usage:
 *   <app-user-avatar [name]="shortName()" [size]="26" />
 *   <app-user-avatar [name]="shortName()" [pictureUrl]="session.pictureUrl" [size]="32" />
 */
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pictureUrl()) {
      <img
        class="photo"
        [src]="pictureUrl()"
        [alt]="name()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        aria-hidden="true"
      />
    } @else {
      <span
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="size() * 0.43"
        aria-hidden="true"
      >{{ initial() }}</span>
    }
  `,
  styles: [`
    :host { display: contents; }

    .photo {
      border-radius: 50%;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }

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
  readonly pictureUrl = input<string>('');
  readonly initial = computed(() => (this.name()[0] ?? '?').toUpperCase());
}
