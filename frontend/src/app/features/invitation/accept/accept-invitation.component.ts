import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';

type PageState = 'loading' | 'ready' | 'processing' | 'error';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  templateUrl: './accept-invitation.component.html',
})
export class AcceptInvitationComponent implements OnInit {

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal('');
  private token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private invitationService: InvitationService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.showError('El enlace de invitación no es válido.');
      return;
    }

    this.token = token;
    // Always save to localStorage in case it needs to go through Google
    this.invitationService.saveToken(token);

    if (this.authService.isAuthenticated()) {
      // Already has session → process directly without going through Google
      this.state.set('processing');
      this.processDirectly(token);
    } else {
      // No session → show confirmation screen
      this.state.set('ready');
    }
  }

  private processDirectly(token: string): void {
    this.invitationService.process({ token }).subscribe({
      next: () => {
        this.invitationService.clearToken();
        // Refresh session so the dashboard sees the new family
        this.authService.refreshSession().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => this.router.navigate(['/dashboard']),
        });
      },
      error: (err) => {
        this.invitationService.clearToken();
        const message = err.error?.message ?? 'La invitación no es válida o expiró.';
        this.showError(message);
      },
    });
  }

  acceptInvitation(): void {
    // No session → go to Google, the callback handles the rest
    this.authService.redirectToGoogle();
  }

  decline(): void {
    this.invitationService.clearToken();
    this.router.navigate(['/dashboard']);
  }

  private showError(message: string): void {
    this.state.set('error');
    this.errorMessage.set(message);
  }
}
