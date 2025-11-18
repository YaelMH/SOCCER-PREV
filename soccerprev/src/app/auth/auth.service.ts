import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // aquí guardo la llave que voy a usar en localStorage para simular la sesión
  private readonly TOKEN_KEY = 'soccerprev_token';

  // aquí manejo el estado de si hay sesión o no
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor() {}

  // aquí reviso si ya existe un "token" guardado
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // aquí regreso el estado actual de autenticación (true/false)
  isAuthenticated(): boolean {
    return this.loggedIn$.value;
  }

  // aquí expongo un observable para reaccionar a cambios de sesión en el template
  authChanges(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  // aquí simulo el login (después conecto esto a Firebase / backend real)
  login(email: string, password: string): void {
    // por ahora no valido nada, solo marco que ya hay sesión
    localStorage.setItem(this.TOKEN_KEY, 'demo-token');
    this.loggedIn$.next(true);
  }

  // aquí cierro sesión
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.loggedIn$.next(false);
  }
}
