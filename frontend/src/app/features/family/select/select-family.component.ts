import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-select-family',
  standalone: true,
  templateUrl: './select-family.component.html',
})
export class SelectFamilyComponent {
  readonly families = computed(() => this.authService.session()?.families ?? []);

  constructor(private authService: AuthService, private router: Router) {
    // If only one family, should not be here
    if (this.families().length === 1) {
      this.authService.setActiveFamily(this.families()[0].familyId);
      this.router.navigate(['/dashboard']);
    }
  }

  select(familyId: number): void {
    this.authService.setActiveFamily(familyId);
    this.router.navigate(['/dashboard']);
  }
}
