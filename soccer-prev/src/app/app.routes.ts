import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register.component').then(m => m.RegisterComponent) },
  { path: 'profile', loadComponent: () => import('./features/profile/pages/profile.component').then(m => m.ProfileComponent) },
  { path: 'condition', loadComponent: () => import('./features/condition/pages/condition-form.component').then(m => m.ConditionFormComponent) },
  { path: 'recommendations', loadComponent: () => import('./features/recommendations/pages/recommendations.component').then(m => m.RecommendationsComponent) },
  { path: 'warmup', loadComponent: () => import('./features/warmup/pages/warmup-routines.component').then(m => m.WarmupRoutinesComponent) },
  { path: 'education', loadComponent: () => import('./features/education/pages/education.component').then(m => m.EducationComponent) },
  { path: 'alerts', loadComponent: () => import('./features/alerts/pages/alerts.component').then(m => m.AlertsComponent) },
  { path: 'history', loadComponent: () => import('./features/history/pages/history.component').then(m => m.HistoryComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
