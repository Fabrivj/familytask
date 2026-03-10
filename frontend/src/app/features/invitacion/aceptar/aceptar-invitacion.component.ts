import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InvitacionService } from '../../../core/services/invitacion.service';

type EstadoPagina = 'cargando' | 'listo' | 'procesando' | 'error';

@Component({
  selector: 'app-aceptar-invitacion',
  standalone: true,
  templateUrl: './aceptar-invitacion.component.html',
})
export class AceptarInvitacionComponent implements OnInit {

  readonly estado = signal<EstadoPagina>('cargando');
  readonly mensajeError = signal('');
  private token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private invitacionService: InvitacionService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.mostrarError('El enlace de invitación no es válido.');
      return;
    }

    this.token = token;
    // Guardar siempre en localStorage por si necesita pasar por Google
    this.invitacionService.guardarToken(token);

    if (this.authService.estaAutenticado()) {
      // Ya tiene sesión → procesar directo sin pasar por Google
      this.estado.set('procesando');
      this.procesarDirecto(token);
    } else {
      // Sin sesión → mostrar pantalla de confirmación
      this.estado.set('listo');
    }
  }

  private procesarDirecto(token: string): void {
    this.invitacionService.procesar({ token }).subscribe({
      next: () => {
        this.invitacionService.limpiarToken();
        // Refrescar sesión para que el dashboard vea la nueva familia
        this.authService.refrescarSesion().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => this.router.navigate(['/dashboard']),
        });
      },
      error: (err) => {
        this.invitacionService.limpiarToken();
        const mensaje = err.error?.message ?? 'La invitación no es válida o expiró.';
        this.mostrarError(mensaje);
      },
    });
  }

  aceptarInvitacion(): void {
    // Sin sesión → ir a Google, el callback se encarga del resto
    this.authService.redirigirAGoogle();
  }

  rechazar(): void {
    this.invitacionService.limpiarToken();
    this.router.navigate(['/dashboard']);
  }

  private mostrarError(mensaje: string): void {
    this.estado.set('error');
    this.mensajeError.set(mensaje);
  }
}
