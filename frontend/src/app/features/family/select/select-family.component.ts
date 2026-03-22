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

  readonly userName = computed(() => {
    return this.authService.session()?.name ?? '';
  });

  readonly shortName = computed(() => {
    return this.userName().split(' ')[0];
  });

  readonly userEmail = computed(() => {
    return this.authService.session()?.email ?? '';
  });

  readonly pictureUrl = computed(() => {
    return this.authService.session()?.pictureUrl ?? '';
  });

  readonly selectedFamilyId = signal<number | null>(null);

  readonly logoutLoading = signal(false);
  readonly logoutError = signal('');
  readonly loadError = signal('');

  constructor() {
    // If only one family, skip this screen
    if (this.families().length === 1) {
      this.authService.setActiveFamily(this.families()[0].familyId);
      this.router.navigate(['/dashboard']);
    } else if (this.families().length > 1) {
      this.selectedFamilyId.set(this.families()[0].familyId);
    }
  }

  ngOnInit(): void {
    this.authService.refreshSession().subscribe({
      next: () => {
        const updated = this.families();
        if (updated.length === 1) {
          this.authService.setActiveFamily(updated[0].familyId);
          this.router.navigate(['/dashboard']);
        } else if (updated.length > 1 && this.selectedFamilyId() === null) {
          this.selectedFamilyId.set(updated[0].familyId);
        }
      },
      error: () => {
        this.loadError.set('No se pudo cargar tu lista de familias. Intenta de nuevo.');
      },
    });
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

    this.authService.logout().subscribe({
      next: (response) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], {
          state: { message: response.message },
        });
      },
      error: (err) => {
        this.logoutError.set(
          err.error?.message ?? 'No se pudo cerrar sesión.'
        );
        this.logoutLoading.set(false);
      },
    });
  }
}
