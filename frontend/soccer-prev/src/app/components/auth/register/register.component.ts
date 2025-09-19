import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    weight: '',
    position: ''
  };

  isLoading: boolean = false;
  errorMessage: string = '';

  positions = [
    { value: 'portero', label: 'Portero' },
    { value: 'defensa', label: 'Defensa' },
    { value: 'mediocampo', label: 'Mediocampo' },
    { value: 'delantero', label: 'Delantero' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.formData).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Error al crear la cuenta';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al registrar usuario';
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.name || !this.formData.email || !this.formData.password) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      return false;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    if (this.formData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      return false;
    }

    return true;
  }
}
