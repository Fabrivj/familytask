import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { InviteDetailsResponse } from '../../../core/models/invitation.model';
import { CardCornersComponent } from '../../../shared/components/card-corners/card-corners.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';

type PageState = 'loading' | 'ready' | 'processing' | 'success' | 'error';

@Component({
  selector: 'app-accept-invitation',
  imports: [MatProgressSpinnerModule, CardCornersComponent, UserAvatarComponent],
  templateUrl: './accept-invitation.component.html',
  styleUrl: './accept-invitation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly invitationService = inject(InvitationService);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal('');
  readonly details = signal<InviteDetailsResponse | null>(null);

  private token = '';

  // ─── Computed helpers ──────────────────────────────────────────────────────
  readonly rolLabel = computed(() => {
    const role = this.details()?.role;
    return role === 'PARENT' ? 'Padre / Tutor' : 'Hijo / a';
  });

  readonly rolEmoji = computed(() => {
    return this.details()?.role === 'PARENT' ? '👑' : '👧';
  });

  readonly expirationText = computed(() => {
    const exp = this.details()?.expirationDate;
    if (!exp) return '';

    const now = new Date();
    const expDate = new Date(exp);
    const diffMs = expDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'Este link ha expirado';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `Este link expira en ${days} día${days > 1 ? 's' : ''} y ${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    return `Este link expira en ${hours} hora${hours !== 1 ? 's' : ''}`;
  });

  readonly inviterInitial = computed(() => {
    const name = this.details()?.invitedByName;
    return name ? name[0].toUpperCase() : '?';
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.showError('El enlace de invitación no es válido.');
      return;
    }

    this.token = token;
    this.invitationService.saveToken(token);
    this.loadDetails(token);
  }

  // ─── Load invitation details (public endpoint, no JWT needed) ──────────────
  private loadDetails(token: string): void {
    this.invitationService.getDetails(token).subscribe({
      next: (details) => {
        this.details.set(details);
        this.state.set('ready');
      },
      error: (err) => {
        const message = err.error?.message ?? 'La invitación no es válida o expiró.';
        this.showError(message);
      },
    });
  }

  // ─── Accept invitation ─────────────────────────────────────────────────────
  acceptInvitation(): void {
    if (this.authService.isAuthenticated()) {
      this.state.set('processing');
      this.invitationService.process({ token: this.token }).subscribe({
        next: () => {
          this.invitationService.clearToken();
          this.authService.refreshSession().subscribe({
            next: () => this.router.navigate(['/family/select']),
            error: () => this.router.navigate(['/family/select']),
          });
        },
        error: (err) => {
          this.invitationService.clearToken();
          const message = err.error?.message ?? 'No se pudo procesar la invitación. Intenta de nuevo.';
          this.showError(message);
        },
      });
    } else {
      this.authService.redirectToGoogle();
    }
  }

  // ─── Reject / decline ─────────────────────────────────────────────────────
  decline(): void {
    this.invitationService.clearToken();
    this.router.navigate(['/']);
  }

  // ─── Error helper ──────────────────────────────────────────────────────────
  private showError(message: string): void {
    this.state.set('error');
    this.errorMessage.set(message);
  }
}
