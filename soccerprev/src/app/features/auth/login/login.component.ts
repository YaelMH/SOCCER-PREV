import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private router = inject(Router);
  private authService = inject(AuthService);

  form = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  // Control de visibilidad del password
  public passwordType: 'password' | 'text' = 'password';

  // 🔥 IMPORTANTE: quitamos el redirect automático en ngOnInit
  // Si alguna vez quieres algo aquí, que solo sea UI, no navegación basada en authChanges.
  // ngOnInit() {}

  togglePasswordVisibility(): void {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  async onSubmit() {
    this.errorMessage = '';

    if (!this.form.email || !this.form.password) {
      this.errorMessage = 'Por favor, ingrese su correo y contraseña.';
      return;
    }

    this.loading = true;

    try {
      const userCredential = await this.authService.login(this.form.email, this.form.password);
      const user = userCredential.user;

      if (user.emailVerified) {
        // ✅ Navegamos al dashboard SOLO cuando el login fue correcto
        this.router.navigate(['/dashboard']); 
      } else {
        await this.authService.logout();
        this.errorMessage = 'Su correo no ha sido verificado. Revise su bandeja de entrada (incluyendo spam).';
      }

    } catch (err: any) {
      console.error('Error de autenticación:', err);

      if (
        err.code === 'auth/invalid-email' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        this.errorMessage = 'Credenciales incorrectas (correo o contraseña no válidos).';
      } else if (err.code === 'auth/wrong-password') {
        this.errorMessage = 'Contraseña incorrecta.';
      } else if (err.code === 'auth/too-many-requests') {
        this.errorMessage = 'Demasiados intentos fallidos. Intente de nuevo más tarde.';
      } else {
        this.errorMessage = `Error de Firebase: ${err.message}`;
      }
    }

    this.loading = false;
  }

  goToRecover() {
    this.router.navigate(['/recuperar-password']);
  }

  goToRegister() {
    this.router.navigate(['/registro']);
  }
}
