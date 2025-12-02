import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  form = {
    firstName: '',
    lastNameP: '',
    lastNameM: '',
    email: '',
    birthDate: '',
    height: '',
    weight: '',
    bmi: '',
    position: '',
    subPosition: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  subPositions: string[] = [];

  loading = false;
  errorMessage = '';
  
  // Para mostrar el error de edad justo debajo del campo de fecha.
  birthDateError: string = '';

  // Modal de Términos
  showTermsModal = false;
  // Modal de Éxito
  showSuccessModal = false;
  
  // Propiedades para el toggle de contraseña
  passwordType: 'password' | 'text' = 'password';
  confirmPasswordType: 'password' | 'text' = 'password';

  // Función para alternar la visibilidad de la contraseña
  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    } else {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
    }
  }

  // =====================
  //       MODALES
  // =====================
  openTermsModal() {
    this.showTermsModal = true;
  }

  closeTermsModal() {
    this.showTermsModal = false;
  }
  
  // Cerrar modal de éxito y navegar a login
  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }

  // Botón "Ir al login" (si lo usas en el template)
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // =====================
  //   SUBPOSICIONES
  // =====================
  updateSubpositions() {
    const pos = this.form.position;

    if (pos === 'Defensa') {
      this.subPositions = ['Central', 'Lateral'];
    } else if (pos === 'Mediocentro') {
      this.subPositions = ['Defensivo', 'Ofensivo', 'Banda', 'Mediocentro puro'];
    } else if (pos === 'Delantero') {
      this.subPositions = ['Delantero', 'Extremo', 'Mediapunta'];
    } else {
      this.subPositions = [];
    }

    this.form.subPosition = '';
  }

  // =====================
  //        BMI
  // =====================
  calculateBMI() {
    const h = Number(this.form.height);
    const w = Number(this.form.weight);

    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      this.form.bmi = bmi.toFixed(2);
    } else {
      this.form.bmi = '';
    }
  }

  // =====================
  //       REGISTRO
  // =====================
  async onSubmit() {
    // 1. Limpiamos errores al inicio
    this.birthDateError = '';
    this.errorMessage = '';

    // Validaciones de formulario
    if (!this.form.firstName || !this.form.lastNameP) {
      this.errorMessage = 'Nombre y apellido paterno son obligatorios.';
      return;
    }
    
    if (!this.form.email || !this.form.password) {
      this.errorMessage = 'El correo y la contraseña son obligatorios.';
      return;
    }

    // VALIDACIÓN DE EDAD MÍNIMA (18 AÑOS)
    const MINIMUM_AGE = 18;
    
    if (!this.form.birthDate) {
      this.errorMessage = 'La fecha de nacimiento es obligatoria.';
      return;
    } else {
      const birthDate = new Date(this.form.birthDate);
      const today = new Date();
      
      const requiredDate = new Date(
        today.getFullYear() - MINIMUM_AGE,
        today.getMonth(),
        today.getDate()
      );

      if (birthDate >= requiredDate) {
        this.birthDateError = `Debe ser mayor de ${MINIMUM_AGE} años para registrarse.`;
        return;
      }
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.form.acceptTerms) {
      this.errorMessage = 'Debes aceptar los términos y condiciones.';
      return;
    }

    this.loading = true;
    console.log('[REGISTER] Enviando formulario a registerUser:', this.form);

    try {
      const {
        firstName, lastNameP, lastNameM, email, password, birthDate,
        height, weight, bmi, position, subPosition
      } = this.form;
      
      // 2. Llamada al servicio (incluye sendEmailVerification + Firestore + signOut)
      await this.authService.registerUser(email, password, {
        firstName,
        lastNameP,
        lastNameM,
        birthDate,
        height,
        weight,
        bmi,
        position,
        subPosition,
      });

      console.log('[REGISTER] registerUser terminó SIN error (usuario ya deslogueado)');

      // 3. Mostrar modal de éxito
      this.showSuccessModal = true;

      // 4. Navegación automática por si no le da clic al botón del modal
      setTimeout(() => {
        if (this.showSuccessModal) {
          this.closeSuccessModal(); // esto ya hace navigate(['/login'])
        }
      }, 3000);

    } catch (err: any) {
      console.error('[REGISTER] Error durante registerUser:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        this.errorMessage =
          'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.';
      } else if (err.message) {
        this.errorMessage = err.message;
      } else {
        this.errorMessage = 'Error durante el registro. Inténtelo de nuevo.';
      }
    } finally {
      this.loading = false;
    }
  }
}
