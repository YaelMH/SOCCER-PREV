import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
/**
 * Interface para las recomendaciones
 */
interface Recommendation {
  id: number;
  title: string;
  description: string;
  type: 'warmup' | 'strengthening' | 'recovery' | 'technique';
  priority: 'alta' | 'media' | 'baja';
  category: string;
  duration: string;
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  completed: boolean;
}

/**
 * Componente Recommendations - Sistema de recomendaciones personalizadas
 * Muestra y gestiona las recomendaciones de prevención de lesiones
 */
@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css']
})
export class RecommendationsComponent implements OnInit {
  currentUser: User | null = null;
  selectedCategory = 'todas';
  selectedPriority = 'todas';

  // Categorías disponibles
  categories = [
    { value: 'todas', label: 'Todas las categorías' },
    { value: 'warmup', label: 'Calentamiento' },
    { value: 'strengthening', label: 'Fortalecimiento' },
    { value: 'recovery', label: 'Recuperación' },
    { value: 'technique', label: 'Técnica' }
  ];

  priorities = [
    { value: 'todas', label: 'Todas las prioridades' },
    { value: 'alta', label: 'Prioridad Alta' },
    { value: 'media', label: 'Prioridad Media' },
    { value: 'baja', label: 'Prioridad Baja' }
  ];

  // Datos mock de recomendaciones - después vendrán del servicio
  allRecommendations: Recommendation[] = [
    {
      id: 1,
      title: 'Calentamiento Dinámico Pre-Entreno',
      description: 'Rutina completa de calentamiento para preparar el cuerpo antes del entrenamiento.',
      type: 'warmup',
      priority: 'alta',
      category: 'Calentamiento',
      duration: '15 minutos',
      difficulty: 'principiante',
      instructions: [
        'Trotar suavemente durante 3 minutos',
        'Realizar movimientos articulares (cabeza, brazos, caderas)',
        'Hacer elevación de rodillas alternada por 1 minuto',
        'Ejecutar talones al glúteo por 1 minuto',
        'Realizar zancadas dinámicas por 2 minutos',
        'Finalizar con carreras laterales por 1 minuto'
      ],
      completed: false
    },
    {
      id: 2,
      title: 'Fortalecimiento de Rodillas',
      description: 'Ejercicios específicos para fortalecer la musculatura que rodea las rodillas.',
      type: 'strengthening',
      priority: 'media',
      category: 'Fortalecimiento',
      duration: '20 minutos',
      difficulty: 'intermedio',
      instructions: [
        'Sentadillas con peso corporal: 3 series de 15 repeticiones',
        'Estocadas alternadas: 3 series de 12 por pierna',
        'Elevación de gemelos: 3 series de 20 repeticiones',
        'Extensión de cuádriceps: 3 series de 15 repeticiones',
        'Flexión de isquiotibiales: 3 series de 12 repeticiones'
      ],
      completed: true
    },
    {
      id: 3,
      title: 'Técnica de Recuperación Post-Entreno',
      description: 'Rutina de enfriamiento y recuperación después de entrenamientos intensos.',
      type: 'recovery',
      priority: 'alta',
      category: 'Recuperación',
      duration: '10 minutos',
      difficulty: 'principiante',
      instructions: [
        'Caminar lentamente por 2 minutos para reducir pulsaciones',
        'Estiramientos estáticos de cuádriceps (30 segundos cada pierna)',
        'Estiramientos de isquiotibiales (30 segundos cada pierna)',
        'Estiramiento de gemelos (30 segundos cada pierna)',
        'Relajación y respiración profunda por 2 minutos'
      ],
      completed: false
    },
    {
      id: 4,
      title: 'Mejora de Técnica de Salto',
      description: 'Ejercicios para mejorar la técnica de salto y prevenir lesiones en rodillas y tobillos.',
      type: 'technique',
      priority: 'baja',
      category: 'Técnica',
      duration: '25 minutos',
      difficulty: 'avanzado',
      instructions: [
        'Saltos en el lugar con técnica correcta: 3 series de 10',
        'Saltos laterales con control: 3 series de 8 por lado',
        'Saltos con una sola pierna: 2 series de 6 por pierna',
        'Aterrizajes controlados desde altura: 3 series de 5',
        'Ejercicios de propiocepción en superficie inestable'
      ],
      completed: false
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

 /**
   * Obtener recomendaciones filtradas
   */
  get filteredRecommendations(): Recommendation[] {
    return this.allRecommendations.filter(rec => {
      const categoryMatch = this.selectedCategory === 'todas' || rec.type === this.selectedCategory;
      const priorityMatch = this.selectedPriority === 'todas' || rec.priority === this.selectedPriority;
      return categoryMatch && priorityMatch;
    });
  }

  /**
   * Marcar recomendación como completada
   */
  markAsCompleted(recommendationId: number): void {
    const recommendation = this.allRecommendations.find(rec => rec.id === recommendationId);
    if (recommendation) {
      recommendation.completed = !recommendation.completed;

      // Aquí se enviaría al backend la actualización
      console.log(`Recomendación ${recommendationId} marcada como ${recommendation.completed ? 'completada' : 'pendiente'}`);
    }
  }

  /**
   * Obtener clase CSS basada en la prioridad
   */
  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Obtener clase CSS basada en el tipo
   */
  getTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'warmup':
        return 'bg-blue-100 text-blue-800';
      case 'strengthening':
        return 'bg-purple-100 text-purple-800';
      case 'recovery':
        return 'bg-green-100 text-green-800';
      case 'technique':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtener clase CSS basada en la dificultad
   */
  getDifficultyClass(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'principiante':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'intermedio':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'avanzado':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  /**
   * Obtener estadísticas de recomendaciones
   */
  get recommendationStats() {
    const total = this.allRecommendations.length;
    const completed = this.allRecommendations.filter(rec => rec.completed).length;
    const pending = total - completed;
    const highPriority = this.allRecommendations.filter(rec => rec.priority === 'alta' && !rec.completed).length;

    return {
      total,
      completed,
      pending,
      highPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Navegar de regreso al dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Cambiar filtro de categoría
   */
  onCategoryChange(category: string): void {
    this.selectedCategory = category;
  }

  /**
   * Cambiar filtro de prioridad
   */
  onPriorityChange(priority: string): void {
    this.selectedPriority = priority;
  }
}
