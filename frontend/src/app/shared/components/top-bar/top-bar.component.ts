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
 *
 * Usage (child view — with gaming HUD):
 *   <app-top-bar
 *     ...
 *     [childLevel]="level"
 *     [childCoins]="coins"
 *     [childXpPercent]="xpPercent"
 *   />
 */
@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, UserChipComponent],
  template: `
    <!-- Left: logo -->
    <span class="logo" aria-label="FamilyTask">FamilyTask</span>

    <!-- Center: desktop shows HUD for child, family chip for parent.
         Mobile always shows family chip (stats go to the strip below). -->
    <div class="center" [class.has-hud]="childLevel() !== null">
      @if (familyName()) {
        <span class="center-family" aria-label="Familia activa">{{ familyName() }}</span>
      }
      @if (childLevel() !== null) {
        <div class="hud-bar" aria-label="Tu estado de juego">
          <div class="hud-lvl-badge" aria-label="Nivel {{ childLevel() }}">
            <span class="hud-lvl-tag" aria-hidden="true">NIV</span>
            <span class="hud-lvl-num" aria-hidden="true">{{ childLevel() }}</span>
          </div>
          <span class="hud-rule" aria-hidden="true"></span>
          @if (familyName()) {
            <span class="hud-family">{{ familyName() }}</span>
            <span class="hud-rule" aria-hidden="true"></span>
          }
          <span class="hud-coins" aria-label="{{ childCoins() ?? 0 }} monedas">
            <mat-icon class="hud-coin-icon" aria-hidden="true">monetization_on</mat-icon>
            {{ childCoins() ?? 0 }}
          </span>
        </div>
      }
    </div>

    <!-- Right: user + logout -->
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
      height: 62px;
      padding: 0 28px;
      border-bottom: 1px solid rgba(var(--border-rgb), 0.09);
      position: relative;
      z-index: 1;
      box-sizing: border-box;
    }

    .logo {
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
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

    /* ── Logout button ── */
    .btn-logout {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .btn-logout mat-icon { font-size: 20px; width: 20px; height: 20px; line-height: 20px; }
    .btn-logout:hover:not(:disabled) { opacity: 0.75; }
    .btn-logout:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-logout:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

    /* ── Family name — same style for parent and child ── */
    .center-family {
      font-family: 'Rajdhani', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* On desktop, hide plain family name when HUD is present (HUD renders it inline) */
    .has-hud .center-family { display: none; }

    /* ── Child HUD bar (desktop only) ── */
    .hud-bar {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .hud-lvl-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: rgba(var(--border-rgb), 0.08);
      border: 1.5px solid rgba(var(--border-rgb), 0.55);
      border-radius: 6px;
      box-shadow: 0 0 10px rgba(var(--border-rgb), 0.18);
      flex-shrink: 0;
    }

    .hud-lvl-tag {
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      letter-spacing: 0.08em;
      color: var(--border);
      opacity: 0.75;
      line-height: 1;
      margin-bottom: 3px;
    }

    .hud-lvl-num {
      font-family: 'Rajdhani', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--border);
      line-height: 1;
      text-shadow: 0 0 8px rgba(var(--border-rgb), 0.5);
    }

    .hud-rule {
      width: 1px;
      height: 22px;
      background: rgba(var(--border-rgb), 0.18);
      flex-shrink: 0;
    }

    .hud-family {
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .hud-coins {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--warning);
      white-space: nowrap;
      text-shadow: 0 0 8px rgba(var(--warning-rgb), 0.4);
    }

    .hud-coin-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    /* ── Mobile: double row layout ── */
    @media (max-width: 767px) {
      :host {
        height: auto;
        padding: 0;
        grid-template-columns: 1fr auto;
        grid-template-rows: 56px 56px;
      }

      .logo { padding-top: 8px; }
      .right { padding-top: 8px; }

      /* Row 1: logo (left) */
      .logo {
        grid-column: 1;
        grid-row: 1;
        font-size: 10px;
        padding-left: 16px;
        align-self: center;
      }

      /* Row 1: avatar + logout (right) */
      .right {
        grid-column: 2;
        grid-row: 1;
        gap: 8px;
        padding-right: 14px;
        align-self: center;
      }

      /* Row 2: HUD or family name — full width, centered */
      .center {
        grid-column: 1 / -1;
        grid-row: 2;
        justify-content: center;
        border-top: 1px solid rgba(var(--border-rgb), 0.1);
        padding: 8px 16px 0;
      }

      /* HUD elements scaled for row 2 */
      .hud-bar { gap: 12px; }
      .hud-lvl-badge { width: 36px; height: 36px; border-radius: 5px; }
      .hud-lvl-tag { font-size: 7px; margin-bottom: 2px; }
      .hud-lvl-num { font-size: 17px; }
      .hud-rule { height: 18px; background: rgba(var(--border-rgb), 0.3); }
      .hud-family { font-size: 13px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; }
      .hud-coins { font-size: 15px; gap: 4px; }
      .hud-coin-icon { font-size: 16px; width: 16px; height: 16px; line-height: 16px; }

      /* Parent family name in row 2 */
      .center-family { font-size: 14px; }
      .has-hud .center-family { display: none; }
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
  readonly childLevel = input<number | null>(null);
  readonly childCoins = input<number | null>(null);
  readonly childXpPercent = input<number>(0);
  readonly logout = output<void>();
}
