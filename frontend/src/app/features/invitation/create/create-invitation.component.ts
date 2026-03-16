import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { CardCornersComponent } from '../../../shared/components/card-corners/card-corners.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-create-invitation',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    CardCornersComponent,
    UserAvatarComponent,
  ],
  templateUrl: './create-invitation.component.html',
  styleUrl: './create-invitation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInvitationComponent {
  private readonly authService = inject(AuthService);
  private readonly invitationService = inject(InvitationService);
  private readonly router = inject(Router);

  // ─── User info ─────────────────────────────────────────────────────────────
  readonly shortName = computed(() => {
    const name = this.authService.session()?.name ?? '';
    return name.split(' ')[0];
  });

  readonly nameInitial = computed(() => {
    return (this.authService.session()?.name?.[0] ?? '?').toUpperCase();
  });

  readonly familyName = computed(() => {
    const families = this.authService.families();
    const activeId = this.authService.getActiveFamilyId();
    return families.find(f => f.familyId === activeId)?.familyName ?? 'Tu familia';
  });

  readonly familyRole = computed(() => {
    const families = this.authService.families();
    const activeId = this.authService.getActiveFamilyId();
    const role = families.find(f => f.familyId === activeId)?.role;
    return role === 'PARENT' ? 'Padre / Tutor' : 'Hijo';
  });

  // ─── Form controls ─────────────────────────────────────────────────────────
  readonly emailCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  readonly roleCtrl = new FormControl<'PARENT' | 'CHILD'>('CHILD', { nonNullable: true });

  // ─── State signals ─────────────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly error = signal('');
  readonly generatedLink = signal('');
  readonly successMessage = signal('');
  readonly linkCopied = signal(false);
  readonly inviteCount = signal(0);

  getEmailError(): string {
    const c = this.emailCtrl;
    if (c.hasError('required')) return 'El correo es obligatorio.';
    if (c.hasError('email')) return 'El correo ingresado no es válido.';
    return '';
  }

  generateLink(): void {
    this.emailCtrl.markAllAsTouched();
    if (this.emailCtrl.invalid) return;

    const email = this.emailCtrl.value.trim();
    const familyId = this.authService.getActiveFamilyId();

    if (!familyId) {
      this.error.set('No hay familia activa seleccionada.');
      return;
    }

    // Reset & start loading
    this.isLoading.set(true);
    this.error.set('');
    this.generatedLink.set('');
    this.successMessage.set('');
    this.linkCopied.set(false);
    this.emailCtrl.disable();

    this.invitationService
      .create({
        invitedEmail: email,
        role: this.roleCtrl.value,
        familyId,
      })
      .subscribe({
        next: (response) => {
          this.generatedLink.set(response.inviteLink);
          this.successMessage.set('Invitación generada exitosamente.');
          this.inviteCount.update(c => c + 1);
          this.isLoading.set(false);
          this.emailCtrl.enable();
        },
        error: (err) => {
          this.error.set(
            err.error?.message ?? 'No se pudo generar la invitación. Intenta de nuevo.'
          );
          this.isLoading.set(false);
          this.emailCtrl.enable();
        },
      });
  }

  copyLink(): void {
    const link = this.generatedLink();
    if (!link) return;

    navigator.clipboard.writeText(link).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    });
  }

  inviteAnother(): void {
    this.emailCtrl.reset();
    this.roleCtrl.reset('CHILD');
    this.error.set('');
    this.generatedLink.set('');
    this.successMessage.set('');
    this.linkCopied.set(false);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
