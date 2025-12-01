import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// 💡 ¡Ruta Corregida! Como el guard y el servicio están en la misma carpeta ('auth/'),
// usamos la ruta relativa './' (mismo directorio).
import { AuthService } from './auth.service'; 
// 💡 Cambiamos 'first' por 'take' (es similar pero a veces más claro) y agregamos 'tap' para debugging.
import { take, map, tap } from 'rxjs/operators'; 

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Evaluando ruta protegida...');

  // Firebase tarda en informar si hay usuario,
  // así que usamos el observable y lo limitamos al primer valor resuelto.
  return authService.authChanges().pipe(
    // 💡 Agregar tap para ver si el observable está emitiendo.
    tap(user => {
        // Esto se ejecutará tan pronto como haya una emisión
        console.log('AuthGuard: Estado de Autenticación resuelto. Usuario:', user ? user.uid : 'null');
    }),
    // 💡 SOLUCIÓN: Usamos take(1) para esperar la primera emisión del estado resuelto.
    take(1),
    map(user => {
      if (!user) {
        console.log('AuthGuard: Usuario no logueado, redirigiendo a /login');
        // Redirección si el estado final es "no logueado"
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
      console.log('AuthGuard: Usuario logueado. Acceso permitido.');
      // Permite la activación si el usuario está logueado
      return true;
    })
  );
};