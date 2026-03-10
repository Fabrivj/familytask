import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seleccionar-familia',
  standalone: true,
  templateUrl: './seleccionar-familia.component.html',
})
export class SeleccionarFamiliaComponent {
  readonly familias = computed(() => this.authService.sesion()?.familias ?? []);

  constructor(private authService: AuthService, private router: Router) {
    // Si solo tiene una familia, no debería estar aquí
    if (this.familias().length === 1) {
      this.authService.setFamiliaActiva(this.familias()[0].familiaId);
      this.router.navigate(['/dashboard']);
    }
  }

  seleccionar(familiaId: number): void {
    this.authService.setFamiliaActiva(familiaId);
    this.router.navigate(['/dashboard']);
  }
}
