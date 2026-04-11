import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { FamilyService } from '../../core/services/family.service';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

const VALID_NAME = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ \-'.]+$/;

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    AppShellComponent,
    PageHeaderComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);

  readonly nameCtrl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
      Validators.pattern(VALID_NAME),
    ],
  });

  readonly rankingEnabledCtrl = new FormControl<boolean>(true, { nonNullable: true });

  readonly isLoading = signal(false);
  readonly apiError = signal('');
  readonly successMessage = signal('');
  readonly isLoadingConfig = signal(true);

  constructor() {
    const familyId = this.authService.getActiveFamilyId();
    const currentName = this.authService.families().find(f => f.familyId === familyId)?.familyName ?? '';
    this.nameCtrl.setValue(currentName);
  }

  ngOnInit(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;

    this.familyService.getFamilyConfig(familyId).subscribe({
      next: (config) => {
        this.rankingEnabledCtrl.setValue(config.rankingEnabled ?? true);
        this.isLoadingConfig.set(false);
      },
      error: () => {
        this.isLoadingConfig.set(false);
      },
    });
  }

  getNameError(): string {
    return 'El nombre debe tener entre 3 y 50 caracteres y no puede contener caracteres inválidos.';
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

    this.familyService.updateName(familyId, { name: this.nameCtrl.value.trim() }).pipe(
      switchMap((family) => {
        this.authService.updateFamilyName(familyId, family.name);
        return this.familyService.updateSettings(familyId, this.rankingEnabledCtrl.value);
      })
    ).subscribe({
      next: () => {
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
