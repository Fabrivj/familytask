import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FamilyService } from '../../../core/services/family.service';

@Component({
  selector: 'app-new-family',
  imports: [ReactiveFormsModule],
  templateUrl: './new-family.component.html',
  styleUrl: './new-family.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFamilyComponent {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly nombreCtrl = new FormControl('', { nonNullable: true });
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mostrarFormulario = signal(false);

  readonly nombreCorto = computed(() => {
    const nombre = this.authService.sesion()?.name ?? '';
    return nombre.split(' ')[0];
  });

  readonly inicialNombre = computed(() => {
    return (this.authService.sesion()?.name?.[0] ?? '?').toUpperCase();
  });

  crear(): void {
    const nombre = this.nombreCtrl.value.trim();
    if (!nombre) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.nombreCtrl.disable();

    this.familyService.crear({ name: nombre }).subscribe({
      next: (familia) => {
        this.authService.agregarFamilia({
          familyId: familia.id,
          familyName: familia.name,
          role: 'PARENT',
        });
        this.authService.setFamiliaActiva(familia.id);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo crear la familia.');
        this.cargando.set(false);
        this.nombreCtrl.enable();
      },
    });
  }

  volver(): void {
    this.nombreCtrl.reset();
    this.error.set('');
    this.mostrarFormulario.set(false);
  }
}
