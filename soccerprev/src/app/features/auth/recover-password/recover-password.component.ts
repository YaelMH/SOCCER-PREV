import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.css'
})
export class RecoverPasswordComponent {
  email = '';
  loading = false;
  message = '';

  constructor(private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.message = '';

    // Aquí luego llamas a Firebase / API para enviar correo
    setTimeout(() => {
      this.loading = false;
      this.message =
        'Si el correo está registrado, se han enviado instrucciones para restablecer la contraseña.';
    }, 800);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
