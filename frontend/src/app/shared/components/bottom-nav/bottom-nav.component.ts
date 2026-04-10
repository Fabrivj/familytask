import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';

/**
 * Bottom navigation bar shown only on mobile (≤767px).
 * Mirrors sidebar navigation with a «Más» sheet for secondary items.
 */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (moreOpen()) {
      <div class="more-backdrop" (click)="closeMore()" aria-hidden="true"></div>
      <div class="more-sheet" role="menu">
        @if (isParent()) {
          <button class="sheet-item" type="button"
            [class.active]="isActive('/family/members')"
            (click)="navigateFrom('/family/members')"
            aria-label="Miembros">
            <mat-icon aria-hidden="true">group</mat-icon>
            Miembros
          </button>
        }
        @if (hasMultipleFamilies()) {
          <button class="sheet-item" type="button"
            [class.active]="isActive('/family/select')"
            (click)="navigateFrom('/family/select')"
            aria-label="Cambiar familia">
            <mat-icon aria-hidden="true">switch_account</mat-icon>
            Cambiar familia
          </button>
        }
        @if (isParent()) {
          <button class="sheet-item" type="button"
            [class.active]="isActive('/settings')"
            (click)="navigateFrom('/settings')"
            aria-label="Configuración">
            <mat-icon aria-hidden="true">settings</mat-icon>
            Configuración
          </button>
        }
      </div>
    }

    <nav class="bottom-nav" aria-label="Navegación principal">
      <button class="nav-item" type="button"
        [class.active]="isActive('/dashboard')"
        (click)="navigate('/dashboard')"
        aria-label="Inicio">
        <mat-icon aria-hidden="true">home</mat-icon>
        <span>Inicio</span>
      </button>

      <button class="nav-item" type="button"
        [class.active]="isActive('/tasks')"
        (click)="navigate('/tasks')"
        aria-label="Tareas">
        <mat-icon aria-hidden="true">task_alt</mat-icon>
        <span>Tareas</span>
      </button>

      <button class="nav-item" type="button"
        [class.active]="isActive('/store')"
        (click)="navigate('/store')"
        aria-label="Tienda">
        <mat-icon aria-hidden="true">store</mat-icon>
        <span>Tienda</span>
      </button>

      <button class="nav-item" type="button"
        [class.active]="isActive('/map')"
        (click)="navigate('/map')"
        aria-label="Mapa">
        <mat-icon aria-hidden="true">map</mat-icon>
        <span>Mapa</span>
      </button>

      <button class="nav-item" type="button"
        [class.more-open]="moreOpen()"
        (click)="toggleMore()"
        [attr.aria-expanded]="moreOpen()"
        aria-label="Más opciones">
        <mat-icon aria-hidden="true">{{ moreOpen() ? 'close' : 'more_horiz' }}</mat-icon>
        <span>Más</span>
      </button>
    </nav>
  `,
  styles: [`
    :host { display: none; }

    @media (max-width: 767px) {
      /* ── Backdrop ── */
      .more-backdrop {
        position: fixed;
        inset: 0;
        z-index: 98;
        background: rgba(0, 0, 0, 0.55);
      }

      /* ── Bottom sheet ── */
      .more-sheet {
        position: fixed;
        bottom: 64px;
        left: 0;
        right: 0;
        z-index: 99;
        background: rgba(7, 0, 37, 0.98);
        border-top: 1.5px solid rgba(0, 239, 255, 0.28);
        border-radius: 20px 20px 0 0;
        padding: 16px 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        animation: sheetUp 0.22s ease;
      }

      @keyframes sheetUp {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }

      .sheet-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
        border: none;
        background: none;
        color: var(--text-sub);
        cursor: pointer;
        border-radius: 10px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        transition: color 0.18s, background 0.18s;
        width: 100%;
        text-align: left;
      }

      .sheet-item mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: var(--border);
        flex-shrink: 0;
      }

      .sheet-item:hover,
      .sheet-item:active {
        color: var(--text);
        background: rgba(0, 239, 255, 0.06);
      }

      .sheet-item.active {
        color: var(--primary);
      }

      .sheet-item.active mat-icon {
        color: var(--primary);
      }

      /* ── Bottom nav bar ── */
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
      }

      .bottom-nav {
        display: flex;
        height: 64px;
        background: rgba(7, 0, 37, 0.98);
        border-top: 1px solid rgba(0, 239, 255, 0.15);
        padding: 0 4px;
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }

      .nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 8px 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(138, 216, 255, 0.35);
        transition: color 0.18s;
        min-height: 44px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        line-height: 1;
      }

      .nav-item mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        line-height: 22px;
        flex-shrink: 0;
      }

      .nav-item:focus-visible {
        outline: 2px solid var(--border);
        outline-offset: -2px;
        border-radius: 8px;
      }

      .nav-item.active {
        color: var(--primary);
      }

      .nav-item.more-open {
        color: var(--border);
      }
    }
  `],
})
export class BottomNavComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly permissionsService = inject(PermissionsService);

  readonly moreOpen = signal(false);
  readonly activeUrl = computed(() => this.router.url);
  readonly isParent = this.permissionsService.isParent;
  readonly hasMultipleFamilies = computed(() => this.authService.families().length > 1);

  isActive(route: string): boolean {
    return this.activeUrl().startsWith(route);
  }

  navigate(route: string): void {
    this.moreOpen.set(false);
    this.router.navigate([route]);
  }

  navigateFrom(route: string): void {
    this.moreOpen.set(false);
    this.router.navigate([route]);
  }

  toggleMore(): void {
    this.moreOpen.update(v => !v);
  }

  closeMore(): void {
    this.moreOpen.set(false);
  }
}
