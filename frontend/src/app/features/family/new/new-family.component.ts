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

  readonly nameCtrl = new FormControl('', { nonNullable: true });
  readonly isLoading = signal(false);
  readonly error = signal('');
  readonly showForm = signal(false);

  readonly shortName = computed(() => {
    const name = this.authService.session()?.name ?? '';
    return name.split(' ')[0];
  });

  readonly nameInitial = computed(() => {
    return (this.authService.session()?.name?.[0] ?? '?').toUpperCase();
  });

  create(): void {
    const name = this.nameCtrl.value.trim();
    if (!name) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    this.isLoading.set(true);
    this.error.set('');
    this.nameCtrl.disable();

    this.familyService.create({ name }).subscribe({
      next: (family) => {
        this.authService.addFamily({
          familyId: family.id,
          familyName: family.name,
          role: 'PARENT',
        });
        this.authService.setActiveFamily(family.id);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo crear la familia.');
        this.isLoading.set(false);
        this.nameCtrl.enable();
      },
    });
  }

  goBack(): void {
    this.nameCtrl.reset();
    this.error.set('');
    this.showForm.set(false);
  }
}
