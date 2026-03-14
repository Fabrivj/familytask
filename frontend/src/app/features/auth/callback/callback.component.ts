import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';

type EstadoCallback = 'procesando' | 'error';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html',
})
export class CallbackComponent implements OnInit {

  readonly estado = signal<EstadoCallback>('procesando');
  readonly mensajeError = signal<string>('');
  readonly pasoActual = signal<string>('Verificando sesión con Google...');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private invitationService: InvitationService,
  ) {}

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'access_denied') {
      this.mostrarError('Inicio de sesión cancelado.');
      return;
    }

    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.mostrarError('No se recibió el código de autorización de Google.');
      return;
    }

    this.procesarCallback(code);
  }

  private procesarCallback(code: string): void {
    // Google manda error=access_denied cuando el usuario cancela
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'access_denied') {
      this.mostrarError('Inicio de sesión cancelado.');
      return;
    }

    this.pasoActual.set('Autenticando con Google...');

    this.authService.procesarGoogleCallback(code).subscribe({
      next: (authResponse) => this.postAutenticacion(authResponse),
      error: (err) => {
        let mensaje: string;
        if (err.status === 0) {
          mensaje = 'No se pudo conectar con Google. Intenta de nuevo.';
        } else if (err.error?.code === 'EMAIL_NOT_FOUND') {
          mensaje = 'No se pudo obtener tu correo. Reintenta el inicio de sesión.';
        } else {
          mensaje = 'No se pudo validar tu sesión con Google. Intenta de nuevo.';
        }
        this.mostrarError(mensaje);
      },
    });
  }

  private postAutenticacion(authResponse: any): void {
    const tokenInvitacion = this.invitationService.obtenerToken();

    if (tokenInvitacion) {
      this.pasoActual.set('Procesando tu invitación...');

      this.invitationService.procesar({ token: tokenInvitacion }).subscribe({
        next: () => {
          this.invitationService.limpiarToken();
          this.pasoActual.set('Cargando tu familia...');
          this.authService.refrescarSesion().subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/dashboard']),
          });
        },
        error: (err) => {                                          // ← aquí
          this.invitationService.limpiarToken();
          const mensaje = err.error?.message ?? 'No se pudo completar la incorporación. Intenta de nuevo.';
          this.mostrarError(mensaje);
        },
      });
    } else {
      this.redirigirPorContexto(authResponse);
    }
  }

  private redirigirPorContexto(authResponse: any): void {
    const families = authResponse.families ?? [];

    if (families.length === 0) {
      // Sin familia → pantalla de creación/espera
      this.router.navigate(['/family/new']);
    } else if (families.length === 1) {
      // Una sola familia → ir al dashboard directamente
      this.authService.setFamiliaActiva(families[0].familyId);
      this.router.navigate(['/dashboard']);
    } else {
      // Varias familias → selección
      this.router.navigate(['/family/select']);
    }
  }

  private mostrarError(mensaje: string): void {
    this.estado.set('error');
    this.mensajeError.set(mensaje);
  }

  volverAlLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
