import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

/**
 * Pill-shaped chip showing the user's avatar and display name,
 * with an optional secondary email line.
 *
 * Usage:
 *   <app-user-chip [name]="shortName()" />
 *   <app-user-chip [name]="shortName()" [email]="userEmail()" [pictureUrl]="pictureUrl()" />
 */
@Component({
  selector: 'app-user-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserAvatarComponent],
  template: `
    <app-user-avatar [name]="name()" [size]="avatarSize()" [pictureUrl]="pictureUrl()" />
    <div class="info">
      <span class="user-name">{{ name() }}</span>
      @if (email()) {
        <span class="user-email">{{ email() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(var(--border-rgb), 0.2);
      border-radius: 20px;
      padding: 5px 12px 5px 6px;
    }

    .info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-family: 'Rajdhani', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-sub);
      letter-spacing: 0.05em;
      line-height: 1.3;
    }

    .user-email {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-sub);
      opacity: 0.7;
      line-height: 1.2;
    }

    @media (max-width: 600px) {
      .user-email {
        display: none;
      }
    }
  `],
})
export class UserChipComponent {
  readonly name = input.required<string>();
  readonly email = input<string>('');
  readonly pictureUrl = input<string>('');
  readonly avatarSize = input<number>(26);
}
