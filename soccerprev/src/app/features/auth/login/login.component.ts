import { Component, inject, OnInit } from '@angular/core'; // 💡 Agregamos OnInit
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 💡 NOTA DE RUTA: Dependiendo de tu estructura, si 'login' está en 'auth/login', 
// la ruta a 'auth.service' podría ser '../auth.service' o './auth.service' si 
// el servicio fue movido. Dejaremos '../../../auth/auth.service' si funciona.
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit { // 💡 Implementamos OnInit

  private router = inject(Router);
  private authService = inject(AuthService);

  form = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  // 👁️ Control de visibilidad del password
  public passwordType: 'password' | 'text' = 'password';

  /**
   * 💡 LÓGICA CLAVE: Redirigir si el usuario ya está autenticado.
   * Esto se ejecuta inmediatamente cuando el componente se carga.
   */
  ngOnInit() {
    this.authService.authChanges().subscribe(user => {
      // 1. Si hay un objeto de usuario (sesión válida según Firebase y la persistencia)...
      if (user) {
        console.log('LoginComponent: Sesión existente detectada. Redirigiendo a /dashboard.');
        
        // 2. Redirigimos inmediatamente al dashboard.
        // Usamos la ruta '/dashboard' que usas en el método onSubmit().
        this.router.navigateByUrl('/dashboard'); 
      }
      // 3. Si user es null, el observable termina y se queda en la pantalla de login.
    });
  }

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
        // Redirección después de iniciar sesión con éxito
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