import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service'; // Asegúrate de que esta ruta sea correcta

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.css'
})
export class RecoverPasswordComponent {
  
  // 💥 Inyección de dependencias moderna
  private router = inject(Router);
  private authService = inject(AuthService);
  
  email = '';
  loading = false;
  
  // Mensaje para mostrar al usuario (éxito o error amigable)
  message: string = ''; 
  // Variable para controlar el color del mensaje (éxito: 'text-primary', error: 'text-danger')
  messageType: 'success' | 'error' = 'success';

  async onSubmit() {
    this.loading = true;
    this.message = '';

    if (!this.email || !this.email.includes('@')) {
        this.message = 'Por favor, ingrese un correo válido.';
        this.messageType = 'error';
        this.loading = false;
        return;
    }

    try {
        // Llama a la función de Firebase
        await this.authService.resetPassword(this.email);

        // 💥 MENSAJE DE ÉXITO ESTÁNDAR (Mejor práctica de seguridad)
        this.message =
          'Si el correo está registrado, se han enviado instrucciones para restablecer la contraseña a su bandeja de entrada.';
        this.messageType = 'success';

    } catch (error: any) {
        console.error("Error al solicitar recuperación:", error);
        
        // 💥 Manejo de errores específicos (aunque Firebase oculta la mayoría)
        if (error.code === 'auth/invalid-email') {
            this.message = 'El formato del correo electrónico no es válido.';
        } else {
            // Para cualquier otro error, mostramos el mensaje de seguridad de todos modos.
            this.message =
                'Si el correo está registrado, se han enviado instrucciones para restablecer la contraseña.';
        }
        this.messageType = 'error'; // Podríamos dejarlo en error si no queremos dar información
    }

    this.loading = false;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}