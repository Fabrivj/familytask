import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_REDIRECT_ON_403 } from './skip-auth-redirect.token';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const is401 = error.status === 401;
      const is403 = error.status === 403 && !req.context.get(SKIP_AUTH_REDIRECT_ON_403);

      if (is401 || is403) {
        authService.clearLocalSession();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
