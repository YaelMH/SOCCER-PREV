import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { RecoverPasswordComponent } from './features/auth/recover-password/recover-password.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ConditionComponent } from './features/condition/condition.component';
import { HistoryComponent } from './features/history/history.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'recuperar-password', component: RecoverPasswordComponent},
  { path: 'perfil', component: ProfileComponent },
  { path: 'condicion-actual', component: ConditionComponent },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'historial', component: HistoryComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

