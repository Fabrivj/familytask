import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const childGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.activeFamily()?.role === 'CHILD') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
