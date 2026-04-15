import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';
import { FamilyService } from '@core/services/family.service';
import { PageLayoutComponent } from '@shared/components/page-layout/page-layout.component';
import { NeonCardComponent } from '@shared/components/neon-card/neon-card.component';
import { TopBarComponent } from '@shared/components/top-bar/top-bar.component';
import { HelpChipComponent } from '@shared/components/help-chip/help-chip.component';
import { VALID_NAME } from '@core/utils/constants';
import { fieldError } from '@core/utils/form-errors';

@Component({
  selector: 'app-new-family',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
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

  readonly shortName = this.authService.shortName;
  readonly nameInitial = this.authService.nameInitial;

  getNameError = () => fieldError(this.nameCtrl, { required: 'El nombre es obligatorio.', minlength: 'Mínimo 3 caracteres.', maxlength: 'Máximo 50 caracteres.', pattern: 'El nombre contiene caracteres inválidos.' });

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
          isAdmin: true,
        });
        this.authService.setActiveFamily(family.id);
        this.router.navigate(['/invitation/create']);
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
