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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { NeonCardComponent } from '../../../shared/components/neon-card/neon-card.component';
import { TopBarComponent } from '../../../shared/components/top-bar/top-bar.component';
import { HelpChipComponent } from '../../../shared/components/help-chip/help-chip.component';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge.component';

@Component({
  selector: 'app-create-invitation',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageLayoutComponent,
    NeonCardComponent,
    TopBarComponent,
    HelpChipComponent,
    RoleBadgeComponent,
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
  readonly shortName = this.authService.shortName;
  readonly nameInitial = this.authService.nameInitial;
  readonly familyName = this.authService.activeFamilyName;

  readonly familyRole = computed((): 'PARENT' | 'CHILD' => {
    const families = this.authService.families();
    const activeId = this.authService.getActiveFamilyId();
    const role = families.find(f => f.familyId === activeId)?.role;
    return role === 'PARENT' ? 'PARENT' : 'CHILD';
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
    this.router.navigate(['/family/members']);
  }
}
