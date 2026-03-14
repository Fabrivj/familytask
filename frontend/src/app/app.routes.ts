import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
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
    path: 'invitation',
    loadComponent: () =>
      import('./features/invitation/accept/accept-invitation.component').then(
        m => m.AcceptInvitationComponent
      ),
  },
  {
    path: 'invitation/create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/invitation/create/create-invitation.component').then(
        m => m.CreateInvitationComponent
      ),
  },
  {
    path: 'family/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/family/new/new-family.component').then(
        m => m.NewFamilyComponent
      ),
  },
  {
    path: 'family/select',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/family/select/select-family.component').then(
        m => m.SelectFamilyComponent
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
    redirectTo: '',
  },
];
