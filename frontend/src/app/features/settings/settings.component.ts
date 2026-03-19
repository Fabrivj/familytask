import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FamilyService } from '../../core/services/family.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { TopBarComponent } from '../../shared/components/top-bar/top-bar.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

const VALID_NAME = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ \-'.]+$/;

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageLayoutComponent,
    TopBarComponent,
    PageHeaderComponent,
    SidebarComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);

  readonly session = this.authService.session;

  readonly shortName = computed(() => this.authService.session()?.name?.split(' ')[0] ?? '');
  readonly currentUserPictureUrl = computed(() => this.authService.session()?.pictureUrl ?? '');
  readonly familyName = computed(() => this.authService.activeFamily()?.familyName ?? '');
  readonly userRole = computed(() => {
    const family = this.authService.activeFamily();
    if (family?.role === 'PARENT') return family.isAdmin ? 'Padre · Admin' : 'Padre · Tutor';
    return 'Hijo/a';
  });

  readonly nameCtrl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
      Validators.pattern(VALID_NAME),
    ],
  });

  readonly isLoading = signal(false);
  readonly apiError = signal('');
  readonly successMessage = signal('');
  readonly logoutLoading = signal(false);

  constructor() {
    const familyId = this.authService.getActiveFamilyId();
    const currentName = this.authService.families().find(f => f.familyId === familyId)?.familyName ?? '';
    this.nameCtrl.setValue(currentName);
  }

  getNameError(): string {
    return 'El nombre debe tener entre 3 y 50 caracteres y no puede contener caracteres inválidos.';
  }

  onLogout(): void {
    this.logoutLoading.set(true);
    this.authService.logout().subscribe({
      next: (res) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], { state: { message: res.message } });
      },
      error: () => {
        this.logoutLoading.set(false);
      },
    });
  }

  save(): void {
    this.nameCtrl.markAllAsTouched();
    if (this.nameCtrl.invalid) return;

    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) {
      this.apiError.set('No hay familia activa seleccionada.');
      return;
    }

    this.isLoading.set(true);
    this.apiError.set('');
    this.successMessage.set('');
    this.nameCtrl.disable();

    this.familyService.updateName(familyId, { name: this.nameCtrl.value.trim() }).subscribe({
      next: (family) => {
        this.authService.updateFamilyName(familyId, family.name);
        this.successMessage.set('Configuración actualizada exitosamente.');
        this.isLoading.set(false);
        this.nameCtrl.enable();
      },
      error: (err) => {
        this.apiError.set(err.error?.message ?? 'No se pudo actualizar la configuración. Intenta nuevamente.');
        this.isLoading.set(false);
        this.nameCtrl.enable();
      },
    });
  }
}
