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
 */
@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserChipComponent],
  template: `
    <span class="logo" aria-label="FamilyTask">FamilyTask</span>
    <div class="right">
      <app-user-chip
        [name]="userName()"
        [email]="userEmail()"
        [pictureUrl]="userPictureUrl()"
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

    @media (max-width: 600px) {
      :host {
        padding: 12px 16px;
      }
    }
  `],
})
export class TopBarComponent {
  readonly userName = input.required<string>();
  readonly userEmail = input<string>('');
  readonly userPictureUrl = input<string>('');
  readonly showLogout = input<boolean>(false);
  readonly logoutLoading = input<boolean>(false);
  readonly logout = output<void>();
}
