import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  readonly mensajeCierre = signal<string | null>(history.state?.message ?? null);

  iniciarSesionConGoogle(): void {
    this.authService.redirigirAGoogle();
  }
}
