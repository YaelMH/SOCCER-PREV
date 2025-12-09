import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { RecoverPasswordComponent } from './features/auth/recover-password/recover-password.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ConditionComponent } from './features/condition/condition.component';
import { HistoryComponent } from './features/history/history.component';
import { ContentComponent } from './features/content/content.component';
import { WarmupComponent } from './features/warmup/warmup.component';
import { authGuard } from './auth/auth.guard';
import { SetNewPasswordComponent } from './features/auth/newpassword/set-new-password.component';

export const routes: Routes = [
  // rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'recuperar-password', component: RecoverPasswordComponent },
  { path: 'restablecer-password', component: SetNewPasswordComponent },


  // rutas protegidas
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'condicion-actual', component: ConditionComponent, canActivate: [authGuard] },
  { path: 'historial', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'contenido', component: ContentComponent, canActivate: [authGuard] },
  { path: 'calentamiento', component: WarmupComponent, canActivate: [authGuard] },
  { path: 'feedback',
  loadComponent: () =>
    import('./features/feedback/feedback.component').then(m => m.FeedbackComponent)
  },
  // redirect por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
  
  
];
