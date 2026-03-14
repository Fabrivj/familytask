import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InvitationService } from '../../core/services/invitation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly session = computed(() => this.authService.session());

  // Incoming success message (e.g. from family creation)
  readonly successMessage = signal<string | null>(history.state?.message ?? null);

  // Logout
  readonly logoutError = signal<string | null>(null);

  // Invitation form
  inviteeEmail = '';
  selectedRole: 'PARENT' | 'CHILD' = 'CHILD';
  readonly isLoadingInvitation = signal(false);
  readonly generatedLink = signal('');
  readonly invitationError = signal('');

  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private router: Router,
  ) {}

  logout(): void {
    this.logoutError.set(null);
    this.authService.logout().subscribe({
      next: (response) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], { state: { message: response.message } });
      },
      error: (err) => {
        this.logoutError.set(err.error?.message ?? 'No se pudo cerrar sesión. Intenta de nuevo.');
      },
    });
  }

  generateInvitation(): void {
    const familyId = this.authService.getActiveFamilyId();

    if (!familyId) {
      this.invitationError.set('No hay familia activa seleccionada.');
      return;
    }

    if (!this.inviteeEmail.trim()) {
      this.invitationError.set('El email es obligatorio.');
      return;
    }

    this.isLoadingInvitation.set(true);
    this.generatedLink.set('');
    this.invitationError.set('');

    this.invitationService.create({
      invitedEmail: this.inviteeEmail.trim(),
      role: this.selectedRole,
      familyId: familyId,
    }).subscribe({
      next: (response) => {
        this.generatedLink.set(response.inviteLink);
        this.isLoadingInvitation.set(false);
      },
      error: (err) => {
        this.invitationError.set(err.error?.message ?? 'No se pudo generar la invitación.');
        this.isLoadingInvitation.set(false);
      },
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.generatedLink());
  }
}
