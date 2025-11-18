import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form = {
    fullName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  loading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  onSubmit() {
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Aquí luego llamas servicio de registro (Firebase, API, etc.)
    setTimeout(() => {
      this.loading = false;
      // Simulación de registro exitoso
      this.router.navigate(['/login']);
    }, 800);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
