import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';

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
  // aquí inyecto el servicio de auth usando la API nueva de inject()
  private authService = inject(AuthService);
  // aquí inyecto el router igual con inject()
  private router = inject(Router);

  // aquí escucho si hay sesión o no para mostrar/ocultar cosas en el layout
  isAuthenticated$: Observable<boolean> = this.authService.authChanges();

  // aquí cierro sesión desde el layout
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
