import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [MatIconModule, UserChipComponent],
  template: `
    <!-- Left: logo -->
    <span class="logo" aria-label="FamilyTask">FamilyTask</span>

    <!-- Center: family chip (truly centered via grid) -->
    <div class="center">
      @if (familyName()) {
        <div class="family-chip" aria-label="Familia activa">
          <mat-icon aria-hidden="true">groups</mat-icon>
          {{ familyName() }}
        </div>
      }
    </div>

    <!-- Right: user + logout -->
    <div class="right">
      <app-user-chip
        [name]="userName()"
        [email]="userRole() || userEmail()"
        [pictureUrl]="userPictureUrl()"
        [avatarSize]="34"
      />
      @if (showLogout()) {
        <button
          class="btn-logout"
          type="button"
          (click)="logout.emit()"
          [disabled]="logoutLoading()"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          @if (logoutLoading()) {
            <mat-icon aria-hidden="true">hourglass_empty</mat-icon>
          } @else {
            <mat-icon aria-hidden="true">power_settings_new</mat-icon>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      height: 56px;
      padding: 0 28px;
      border-bottom: 1px solid rgba(var(--border-rgb), 0.09);
      position: relative;
      z-index: 1;
      box-sizing: border-box;
    }

    .logo {
      font-family: 'Press Start 2P', monospace;
      font-size: 11px;
      color: var(--text);
      text-shadow: -1px 0 0 var(--primary), 1px 0 0 var(--border);
    }

    .center {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-logout {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      transition: color 0.2s, opacity 0.2s;
      flex-shrink: 0;
    }

    .btn-logout mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .btn-logout:hover:not(:disabled) {
      opacity: 0.75;
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
      gap: 6px;
      background: rgba(var(--border-rgb), 0.06);
      border: 1.5px solid rgba(var(--border-rgb), 0.28);
      border-radius: 20px;
      padding: 0 14px 0 10px;
      height: 34px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: 0.04em;
      white-space: nowrap;
      box-sizing: border-box;
    }

    .family-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
      color: var(--border);
      flex-shrink: 0;
    }

    @media (max-width: 767px) {
      :host {
        padding: 0 12px;
        grid-template-columns: auto 1fr auto;
        gap: 6px;
      }
      .logo { font-size: 9px; }
      .family-chip {
        font-size: 11px;
        padding: 0 10px 0 8px;
        height: 30px;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .family-chip mat-icon { display: none; }
      .right { gap: 6px; }
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
