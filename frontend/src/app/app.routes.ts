import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { childGuard } from './core/guards/child.guard';
import { parentGuard } from './core/guards/parent.guard';

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
    canActivate: [authGuard, parentGuard],
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
    path: 'family/members',
    canActivate: [authGuard, parentGuard],
    loadComponent: () =>
      import('./features/family/members/family-members.component').then(
        m => m.FamilyMembersComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard, parentGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'map',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/map/home-map.component').then(m => m.HomeMapComponent),
  },
  {
    path: 'store',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/store/store.component').then(m => m.StoreComponent),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/tasks-habits/tasks-habits.component').then(m => m.TasksHabitsComponent),
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ranking/ranking.component').then(m => m.RankingComponent),
  },
  {
    path: 'badges',
    canActivate: [authGuard, childGuard],
    loadComponent: () =>
      import('./features/badges/badges.component').then(m => m.BadgesComponent),
  },
  {
    path: 'ai/suggestions',
    canActivate: [authGuard, parentGuard],
    loadComponent: () =>
      import('./features/suggestions/suggestions.component').then(m => m.SuggestionsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
