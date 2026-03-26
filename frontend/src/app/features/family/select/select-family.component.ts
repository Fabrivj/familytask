import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { TopBarComponent } from '../../../shared/components/top-bar/top-bar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge.component';

@Component({
  selector: 'app-select-family',
  imports: [MatIconModule, PageLayoutComponent, TopBarComponent, PageHeaderComponent, RoleBadgeComponent],
  templateUrl: './select-family.component.html',
  styleUrl: './select-family.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFamilyComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly families = computed(() => this.authService.session()?.families ?? []);

  readonly shortName = this.authService.shortName;

  readonly userEmail = computed(() => {
    return this.authService.session()?.email ?? '';
  });

  readonly pictureUrl = computed(() => {
    return this.authService.session()?.pictureUrl ?? '';
  });

  readonly selectedFamilyId = signal<number | null>(null);

  readonly logoutLoading = signal(false);
  readonly logoutError = signal('');

  ngOnInit(): void {
    const current = this.families();
    if (current.length === 1) {
      this.authService.setActiveFamily(current[0].familyId);
      this.router.navigate(['/dashboard']);
    } else if (current.length > 1) {
      this.selectedFamilyId.set(current[0].familyId);
    }
  }

  selectCard(familyId: number): void {
    this.selectedFamilyId.set(familyId);
  }

  isSelected(familyId: number): boolean {
    return this.selectedFamilyId() === familyId;
  }

  select(familyId: number): void {
    this.authService.setActiveFamily(familyId);
    this.router.navigate(['/family/members']);
  }

  createNew(): void {
    this.router.navigate(['/family/new']);
  }

  getRoleShort(role: string): string {
    return role === 'PARENT' ? 'Padre' : 'Hijo';
  }

  logout(): void {
    this.logoutLoading.set(true);
    this.logoutError.set('');

    this.authService.performLogout().subscribe({
      error: (err) => {
        this.logoutError.set(err.error?.message ?? 'No se pudo cerrar sesión.');
        this.logoutLoading.set(false);
      },
    });
  }
}
