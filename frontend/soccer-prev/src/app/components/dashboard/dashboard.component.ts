import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

/**
 * Componente Dashboard - Página principal después del login
 * Muestra resumen de actividades, recomendaciones y accesos rápidos
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  // Data mock para el dashboard - después vendrá del servicio real
  dashboardData = {
    recentRecommendations: [
      {
        id: 1,
        title: 'Calentamiento pre-entreno',
        description: 'Rutina de 15 minutos antes de entrenar',
        type: 'warmup',
        priority: 'alta'
      },
      {
        id: 2,
        title: 'Fortalecimiento de rodillas',
        description: 'Ejercicios para prevenir lesiones en rodillas',
        type: 'strengthening',
        priority: 'media'
      }
    ],
    quickStats: {
      totalRecommendations: 12,
      completedToday: 3,
      injuryRisk: 'Bajo'
    },
    recentActivity: [
      {
        date: '2025-01-19',
        activity: 'Completó rutina de calentamiento',
        type: 'completed'
      },
      {
        date: '2025-01-18',
        activity: 'Registró dolor leve en gemelo izquierdo',
        type: 'injury'
      }
    ]
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
      } else {
        // Si no hay usuario, redirigir al login
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Obtener inicial del nombre del usuario de forma segura
   * @returns string - Primera letra del nombre o 'U' por defecto
   */
  getUserInitial(): string {
    if (this.currentUser?.name && this.currentUser.name.length > 0) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    return 'U'; // Default inicial si no hay nombre
  }

  /**
   * Obtener nombre del usuario de forma segura
   * @returns string - Nombre del usuario o 'Usuario' por defecto
   */
  getUserName(): string {
    return this.currentUser?.name || 'Usuario';
  }

  /**
   * Cerrar sesión del usuario actual
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Obtener clase CSS basada en la prioridad de recomendación
   * @param priority - Nivel de prioridad (alta, media, baja)
   * @returns string - Clases CSS de Tailwind
   */
  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
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
   * Obtener clase CSS basada en el tipo de actividad
   * @param type - Tipo de actividad (completed, injury, etc.)
   * @returns string - Clases CSS de Tailwind
   */
  getActivityTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'injury':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  /**
   * Navegar a la sección de recomendaciones
   */
  goToRecommendations(): void {
    this.router.navigate(['/recommendations']);
  }

  /**
   * Navegar al perfil del usuario
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
