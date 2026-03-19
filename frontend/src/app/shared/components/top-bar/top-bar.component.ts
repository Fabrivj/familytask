import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UserChipComponent } from '../user-chip/user-chip.component';

/**
 * Top navigation bar with the FamilyTask logo, the current user's chip,
 * and an optional logout button that sits BESIDE (not inside) the chip.
 *
 * Usage (no logout — onboarding/card pages):
 *   <app-top-bar [userName]="shortName()" />
 *
 * Usage (with logout — dashboard, select-family):
 *   <app-top-bar
 *     [userName]="shortName()"
 *     [userEmail]="userEmail()"
 *     [userPictureUrl]="pictureUrl()"
 *     [showLogout]="true"
 *     [logoutLoading]="isLoading()"
 *     (logout)="onLogout()"
 *   />
 *
 * Usage (with family chip — sidebar pages):
 *   <app-top-bar
 *     [userName]="shortName()"
 *     [userPictureUrl]="pictureUrl()"
 *     [familyName]="familyName()"
 *     [userRole]="userRole()"
 *   />
 */
@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserChipComponent],
  template: `
    <span class="logo" aria-label="FamilyTask">FamilyTask</span>

    @if (familyName()) {
      <div class="family-chip" aria-label="Familia activa">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 7.5L8 2l6 5.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V7.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
        {{ familyName() }}
      </div>
    }

    <div class="right">
      <app-user-chip
        [name]="userName()"
        [email]="userRole() || userEmail()"
        [pictureUrl]="userPictureUrl()"
        [avatarSize]="36"
      />
      @if (showLogout()) {
        <button
          class="btn-logout"
          type="button"
          (click)="logout.emit()"
          [disabled]="logoutLoading()"
          aria-label="Cerrar sesión"
        >
          {{ logoutLoading() ? 'Saliendo...' : 'Cerrar sesión' }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px;
      border-bottom: 1px solid rgba(var(--border-rgb), 0.09);
      position: relative;
      z-index: 1;
    }

    .logo {
      font-family: 'Press Start 2P', monospace;
      font-size: 11px;
      color: var(--text);
      text-shadow: -1px 0 0 var(--primary), 1px 0 0 var(--border);
    }

    .right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-logout {
      background: none;
      border: 1px solid rgba(var(--primary-rgb), 0.27);
      border-radius: 20px;
      padding: 5px 14px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      white-space: nowrap;
    }

    .btn-logout:hover:not(:disabled) {
      border-color: var(--primary);
      background: rgba(var(--primary-rgb), 0.05);
    }

    .btn-logout:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-logout:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .family-chip {
      display: flex;
      align-items: center;
      gap: 7px;
      background: rgba(var(--border-rgb), 0.06);
      border: 1.5px solid rgba(var(--border-rgb), 0.28);
      border-radius: 20px;
      padding: 5px 14px 5px 10px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .family-chip svg {
      width: 14px;
      height: 14px;
      color: var(--border);
      flex-shrink: 0;
    }

    @media (max-width: 600px) {
      :host { padding: 12px 16px; }
      .family-chip { display: none; }
    }
  `],
})
export class TopBarComponent {
  readonly userName = input.required<string>();
  readonly userEmail = input<string>('');
  readonly userPictureUrl = input<string>('');
  readonly familyName = input<string>('');
  readonly userRole = input<string>('');
  readonly showLogout = input<boolean>(false);
  readonly logoutLoading = input<boolean>(false);
  readonly logout = output<void>();
}
