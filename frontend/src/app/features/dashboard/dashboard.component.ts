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
  readonly sesion = computed(() => this.authService.sesion());

  // Formulario de invitación
  emailInvitado = '';
  rolSeleccionado: 'PARENT' | 'CHILD' = 'CHILD';
  readonly cargandoInvitacion = signal(false);
  readonly linkGenerado = signal('');
  readonly errorInvitacion = signal('');

  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private router: Router,
  ) {}

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }

  generarInvitacion(): void {
    const familiaId = this.authService.getFamiliaActivaId();

    if (!familiaId) {
      this.errorInvitacion.set('No hay familia activa seleccionada.');
      return;
    }

    if (!this.emailInvitado.trim()) {
      this.errorInvitacion.set('El email es obligatorio.');
      return;
    }

    this.cargandoInvitacion.set(true);
    this.linkGenerado.set('');
    this.errorInvitacion.set('');

    this.invitationService.crear({
      invitedEmail: this.emailInvitado.trim(),
      role: this.rolSeleccionado,
      familyId: familiaId,
    }).subscribe({
      next: (response) => {
        this.linkGenerado.set(response.inviteLink);
        this.cargandoInvitacion.set(false);
      },
      error: (err) => {
        this.errorInvitacion.set(err.error?.message ?? 'No se pudo generar la invitación.');
        this.cargandoInvitacion.set(false);
      },
    });
  }

  copiarLink(): void {
    navigator.clipboard.writeText(this.linkGenerado());
  }
}
