import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';

@Component({
  selector: 'app-create-invitation',
  imports: [ReactiveFormsModule],
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
  readonly emailCtrl = new FormControl('', { nonNullable: true });
  readonly roleCtrl = new FormControl<'PARENT' | 'CHILD'>('CHILD', { nonNullable: true });

  // ─── State signals ─────────────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly error = signal('');
  readonly generatedLink = signal('');
  readonly successMessage = signal('');
  readonly linkCopied = signal(false);
  readonly inviteCount = signal(0);

  // ─── Validation ────────────────────────────────────────────────────────────
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  generateLink(): void {
    const email = this.emailCtrl.value.trim();
    const familyId = this.authService.getActiveFamilyId();

    // Validate email
    if (!email) {
      this.error.set('El correo es obligatorio.');
      return;
    }

    if (!this.EMAIL_REGEX.test(email)) {
      this.error.set('El correo ingresado no es válido.');
      return;
    }

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
