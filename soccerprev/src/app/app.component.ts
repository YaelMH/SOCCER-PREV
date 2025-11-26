import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos NavigationEnd para detectar el final de la navegación
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router'; 
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';
// Filtramos solo el evento de navegación final
import { map } from 'rxjs/operators'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Devuelve true si hay usuario logueado (Firebase)
  isAuthenticated$: Observable<boolean> = this.authService.authChanges().pipe(
    map(user => !!user)
  );
  
  // Eliminamos la lógica de showNav y el constructor.
  // El header siempre se muestra, pero el contenido interno se restringe con isAuthenticated$.

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}