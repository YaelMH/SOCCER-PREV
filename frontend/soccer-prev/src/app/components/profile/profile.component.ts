import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

/**
 * Componente Profile - Gestión del perfil del usuario
 * Permite ver y editar información personal, historial de lesiones y actividad
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Formulario de edición del perfil
  profileForm = {
    name: '',
    email: '',
    age: '',
    weight: '',
    position: '',
    phone: '',
    emergencyContact: ''
  };

  // Datos mock del historial de lesiones
  injuryHistory = [
    {
      id: 1,
      date: '2024-12-15',
      type: 'Esguince de tobillo',
      severity: 'Leve',
      location: 'Tobillo derecho',
      recoveryTime: '2 semanas',
      status: 'Recuperado'
    },
    {
      id: 2,
      date: '2024-10-03',
      type: 'Contractura muscular',
      severity: 'Moderada',
      location: 'Gemelo izquierdo',
      recoveryTime: '1 semana',
      status: 'Recuperado'
    }
  ];

  // Historial de actividad mock
  activityHistory = [
    {
      date: '2025-01-19',
      activity: 'Entrenamiento completo',
      duration: '90 min',
      intensity: 'Alta',
      notes: 'Buen rendimiento general'
    },
    {
      date: '2025-01-17',
      activity: 'Calentamiento y estiramientos',
      duration: '30 min',
      intensity: 'Baja',
      notes: 'Rutina preventiva'
    },
    {
      date: '2025-01-15',
      activity: 'Entrenamiento técnico',
      duration: '60 min',
      intensity: 'Media',
      notes: 'Trabajo con balón'
    }
  ];

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

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.loadProfileData();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Cargar datos del perfil en el formulario
   */
  private loadProfileData(): void {
    if (this.currentUser) {
      this.profileForm = {
        name: this.currentUser.name || '',
        email: this.currentUser.email || '',
        age: this.currentUser.age?.toString() || '',
        weight: this.currentUser.weight?.toString() || '',
        position: this.currentUser.position || '',
        phone: '', // Estos campos se agregarían a la interfaz User
        emergencyContact: ''
      };
    }
  }

  /**
   * Activar modo de edición
   */
  startEditing(): void {
    this.isEditing = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Cancelar edición y restaurar datos originales
   */
  cancelEditing(): void {
    this.isEditing = false;
    this.loadProfileData();
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Guardar cambios del perfil
   */
  saveProfile(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulación de guardado - aquí se conectaría con el backend
    setTimeout(() => {
      this.isLoading = false;
      this.isEditing = false;
      this.successMessage = 'Perfil actualizado correctamente';

      // Actualizar el usuario actual (simulado)
      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          name: this.profileForm.name,
          email: this.profileForm.email,
          age: parseInt(this.profileForm.age) || undefined,
          weight: parseInt(this.profileForm.weight) || undefined,
          position: this.profileForm.position
        };
      }
    }, 1000);
  }

  /**
   * Validar formulario de perfil
   */
  private validateForm(): boolean {
    if (!this.profileForm.name.trim()) {
      this.errorMessage = 'El nombre es obligatorio';
      return false;
    }

    if (!this.profileForm.email.trim()) {
      this.errorMessage = 'El email es obligatorio';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profileForm.email)) {
      this.errorMessage = 'Email inválido';
      return false;
    }

    return true;
  }

  /**
   * Obtener clase CSS para el estado de la lesión
   */
  getInjuryStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'recuperado':
        return 'bg-green-100 text-green-800';
      case 'en recuperación':
        return 'bg-yellow-100 text-yellow-800';
      case 'activa':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtener clase CSS para la intensidad de actividad
   */
  getIntensityClass(intensity: string): string {
    switch (intensity.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Navegar de regreso al dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Agregar nueva lesión (placeholder)
   */
  addInjury(): void {
    // Por ahora solo muestra mensaje - se implementaría un modal o navegación
    alert('Función para agregar nueva lesión - se implementará en versión completa');
  }

  /**
   * Registrar nueva actividad (placeholder)
   */
  addActivity(): void {
    // Por ahora solo muestra mensaje - se implementaría un modal o navegación
    alert('Función para registrar nueva actividad - se implementará en versión completa');
  }
}
