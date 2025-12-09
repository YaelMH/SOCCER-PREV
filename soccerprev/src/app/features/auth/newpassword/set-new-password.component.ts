// src/app/features/auth/set-new-password/set-new-password.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { confirmPasswordReset } from 'firebase/auth';

@Component({
  selector: 'app-set-new-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.css'
})
export class SetNewPasswordComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);

  oobCode: string | null = null;

  password = '';
  confirmPassword = '';
  loading = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  // Toggle de visibilidad de contraseña (igual que en registro)
  passwordType: 'password' | 'text' = 'password';
  confirmPasswordType: 'password' | 'text' = 'password';

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');

    if (!this.oobCode) {
      this.message = 'El enlace de restablecimiento no es válido o ha expirado.';
      this.messageType = 'error';
    }
  }

  // Misma regla que en registro:
  // mínimo 8 caracteres, al menos una mayúscula y un número
  private isPasswordStrong(pwd: string): boolean {
    const regex = /^(?=.*[0-9])(?=.*[A-Z]).{8,}$/;
    return regex.test(pwd);
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    } else {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
    }
  }

  async onSubmit(form: NgForm) {
    if (!this.oobCode) return;
    if (form.invalid) return;

    this.message = '';
    this.loading = true;

    if (!this.isPasswordStrong(this.password)) {
      this.message = 'Debe tener al menos 8 caracteres, una mayúscula y un número.';
      this.messageType = 'error';
      this.loading = false;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.message = 'Las contraseñas no coinciden.';
      this.messageType = 'error';
      this.loading = false;
      return;
    }

    try {
      await confirmPasswordReset(this.auth, this.oobCode, this.password);

      this.message = 'Tu contraseña se ha restablecido correctamente. Ahora puedes iniciar sesión.';
      this.messageType = 'success';

      // Si quieres redirigir automáticamente al login:
      // setTimeout(() => this.router.navigate(['/login']), 2500);

    } catch (error) {
      console.error(error);
      this.message =
        'Ocurrió un error al restablecer la contraseña. Solicita de nuevo el correo de recuperación.';
      this.messageType = 'error';
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
