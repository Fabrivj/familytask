import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InvitacionService } from '../../core/services/invitacion.service';

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
  rolSeleccionado: 'PADRE_TUTOR' | 'HIJO' = 'HIJO';
  readonly cargandoInvitacion = signal(false);
  readonly linkGenerado = signal('');
  readonly errorInvitacion = signal('');

  constructor(
    private authService: AuthService,
    private invitacionService: InvitacionService,
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

    this.invitacionService.crear({
      emailInvitado: this.emailInvitado.trim(),
      rol: this.rolSeleccionado,
      familiaId,
    }).subscribe({
      next: (response) => {
        this.linkGenerado.set(response.linkInvitacion);
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
