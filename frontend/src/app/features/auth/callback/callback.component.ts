import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { NeonCardComponent } from '../../../shared/components/neon-card/neon-card.component';

type CallbackState = 'processing' | 'error';

@Component({
  selector: 'app-callback',
  imports: [MatProgressSpinnerModule, PageLayoutComponent, NeonCardComponent],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly invitationService = inject(InvitationService);

  readonly state = signal<CallbackState>('processing');
  readonly errorMessage = signal<string>('');
  readonly currentStep = signal<string>('Verificando sesión con Google...');

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'access_denied') {
      this.showError('Inicio de sesión cancelado.');
      return;
    }

    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.showError('No se recibió el código de autorización de Google.');
      return;
    }

    this.processCallback(code);
  }

  private processCallback(code: string): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'access_denied') {
      this.showError('Inicio de sesión cancelado.');
      return;
    }

    this.currentStep.set('Autenticando con Google...');

    this.authService.processGoogleCallback(code).subscribe({
      next: (authResponse) => this.postAuthentication(authResponse),
      error: (err) => {
        let message: string;
        if (err.status === 0) {
          message = 'No se pudo conectar con Google. Intenta de nuevo.';
        } else if (err.error?.code === 'EMAIL_NOT_FOUND') {
          message = 'No se pudo obtener tu correo. Reintenta el inicio de sesión.';
        } else {
          message = 'No se pudo validar tu sesión con Google. Intenta de nuevo.';
        }
        this.showError(message);
      },
    });
  }

  private postAuthentication(authResponse: any): void {
    const invitationToken = this.invitationService.getToken();

    if (invitationToken) {
      this.currentStep.set('Procesando tu invitación...');

      this.invitationService.process({ token: invitationToken }).subscribe({
        next: () => {
          this.invitationService.clearToken();
          this.currentStep.set('Cargando tu familia...');
          this.authService.refreshSession().subscribe({
            next: () => this.redirectByFamilyCount(),
            error: () => this.router.navigate(['/family/select']),
          });
        },
        error: (err) => {
          this.invitationService.clearToken();
          const message = err.error?.message ?? 'No se pudo completar la incorporación. Intenta de nuevo.';
          this.showError(message);
        },
      });
    } else {
      this.redirectByContext(authResponse);
    }
  }

  private redirectByContext(authResponse: any): void {
    const families = authResponse.families ?? [];

    if (families.length === 0) {
      this.router.navigate(['/family/new']);
    } else if (families.length === 1) {
      this.authService.setActiveFamily(families[0].familyId);
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/family/select']);
    }
  }

  private redirectByFamilyCount(): void {
    const families = this.authService.families();
    if (families.length === 1) {
      this.authService.setActiveFamily(families[0].familyId);
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/family/select']);
    }
  }

  private showError(message: string): void {
    this.state.set('error');
    this.errorMessage.set(message);
  }

  goBackToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}

