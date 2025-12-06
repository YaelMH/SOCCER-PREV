import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User } from '@angular/fire/auth';

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


  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
  
  // Ruta CORRECTA - el archivo está en src/assets/
  logoPath = 'assets/LogoSoccer.png';
  imageLoaded = true;

  // Saber si hay sesión
  isAuthenticated$: Observable<boolean> = this.authService.authChanges().pipe(
    map(user => !!user)
  );

  // Datos del usuario en Firestore
  userData$: Observable<any> = this.authService.authChanges().pipe(
    switchMap((user: User | null) => {
      if (!user) return of(null);
      return this.authService.getUserData(user.uid);
    })
  );

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}