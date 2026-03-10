import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FamiliaService } from '../../../core/services/familia.service';

@Component({
  selector: 'app-nueva-familia',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nueva-familia.component.html',
})
export class NuevaFamiliaComponent {
  nombre = '';
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mostrarFormulario = signal(false);

  constructor(
    private familiaService: FamiliaService,
    private authService: AuthService,
    private router: Router,
  ) {}

  crear(): void {
    if (!this.nombre.trim()) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');

    this.familiaService.crear({ nombre: this.nombre.trim() }).subscribe({
      next: (familia) => {
        this.authService.agregarFamilia({
          familiaId: familia.id,
          familiaNombre: familia.nombre,
          rol: 'PADRE_TUTOR',
        });
        this.authService.setFamiliaActiva(familia.id);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo crear la familia.');
        this.cargando.set(false);
      },
    });
  }

  esperarInvitacion(): void {
    // Simplemente va al dashboard, que mostrará el estado de espera
    this.router.navigate(['/dashboard']);
  }
}
