import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { FamilyService } from '../../../core/services/family.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { NeonCardComponent } from '../../../shared/components/neon-card/neon-card.component';
import { TopBarComponent } from '../../../shared/components/top-bar/top-bar.component';
import { HelpChipComponent } from '../../../shared/components/help-chip/help-chip.component';

const VALID_NAME = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ \-'.]+$/;

@Component({
  selector: 'app-new-family',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageLayoutComponent,
    NeonCardComponent,
    TopBarComponent,
    HelpChipComponent,
  ],
  templateUrl: './new-family.component.html',
  styleUrl: './new-family.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFamilyComponent {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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
  readonly showForm = signal(false);

  readonly shortName = computed(() => {
    const name = this.authService.session()?.name ?? '';
    return name.split(' ')[0];
  });

  readonly nameInitial = computed(() => {
    return (this.authService.session()?.name?.[0] ?? '?').toUpperCase();
  });

  getNameError(): string {
    const c = this.nameCtrl;
    if (c.hasError('required')) return 'El nombre es obligatorio.';
    if (c.hasError('minlength')) return 'Mínimo 3 caracteres.';
    if (c.hasError('maxlength')) return 'Máximo 50 caracteres.';
    if (c.hasError('pattern')) return 'El nombre contiene caracteres inválidos.';
    return '';
  }

  create(): void {
    this.nameCtrl.markAllAsTouched();
    if (this.nameCtrl.invalid) return;

    const name = this.nameCtrl.value.trim();
    this.isLoading.set(true);
    this.apiError.set('');
    this.nameCtrl.disable();

    this.familyService.create({ name }).subscribe({
      next: (family) => {
        this.authService.addFamily({
          familyId: family.id,
          familyName: family.name,
          role: 'PARENT',
        });
        this.authService.setActiveFamily(family.id);
        this.router.navigate(['/family/members'], {
          state: { message: 'Familia creada exitosamente.' },
        });
      },
      error: (err) => {
        this.apiError.set(err.error?.message ?? 'No se pudo crear la familia. Intenta de nuevo.');
        this.isLoading.set(false);
        this.nameCtrl.enable();
      },
    });
  }

  goBack(): void {
    this.nameCtrl.reset();
    this.apiError.set('');
    this.showForm.set(false);
  }
}
