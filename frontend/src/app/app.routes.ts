import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'concepts',
    loadComponent: () =>
      import('./features/concepts/concept-list/concept-list.component').then(
        (m) => m.ConceptListComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'concepts/new',
    loadComponent: () =>
      import('./features/concepts/concept-form/concept-form.component').then(
        (m) => m.ConceptFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'concepts/:id',
    loadComponent: () =>
      import('./features/concepts/concept-detail/concept-detail.component').then(
        (m) => m.ConceptDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'concepts/:id/edit',
    loadComponent: () =>
      import('./features/concepts/concept-form/concept-form.component').then(
        (m) => m.ConceptFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'sources',
    loadComponent: () =>
      import('./features/sources/source-list/source-list.component').then(
        (m) => m.SourceListComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'sources/new',
    loadComponent: () =>
      import('./features/sources/source-upload/source-upload.component').then(
        (m) => m.SourceUploadComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'sources/:id',
    loadComponent: () =>
      import('./features/sources/source-detail/source-detail.component').then(
        (m) => m.SourceDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'decay-alerts',
    loadComponent: () =>
      import('./features/decay-alerts/decay-alerts.component').then(
        (m) => m.DecayAlertsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'challenges/:conceptId',
    loadComponent: () =>
      import('./features/challenges/challenge-taking.component').then(
        (m) => m.ChallengeTakingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'study-plan',
    loadComponent: () =>
      import('./features/study-plan/study-plan.component').then(
        (m) => m.StudyPlanComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
