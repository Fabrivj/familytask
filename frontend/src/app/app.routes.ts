import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/callback/callback.component').then(m => m.CallbackComponent),
  },
  {
    path: 'invitacion',
    loadComponent: () =>
      import('./features/invitacion/aceptar/aceptar-invitacion.component').then(
        m => m.AceptarInvitacionComponent
      ),
  },
  {
    path: 'familia/nueva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/familia/nueva/nueva-familia.component').then(
        m => m.NuevaFamiliaComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
  {
    path: 'familia/seleccionar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/familia/seleccionar/seleccionar-familia.component').then(
        m => m.SeleccionarFamiliaComponent
      ),
  },
];
