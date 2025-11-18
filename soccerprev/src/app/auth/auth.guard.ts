import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // aquí reviso si ya hay sesión activa
  if (!authService.isAuthenticated()) {
    // aquí mando al login si no hay sesión
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // si sí hay sesión, dejo pasar
  return true;
};
