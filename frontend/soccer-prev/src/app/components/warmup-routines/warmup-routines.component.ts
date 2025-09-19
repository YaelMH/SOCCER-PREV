import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

/**
 * Interface para las rutinas de calentamiento
 */
interface WarmupExercise {
  id: number;
  name: string;
  description: string;
  duration: number; // en segundos
  repetitions?: number;
  instructions: string[];
  imageUrl?: string;
  videoUrl?: string;
}

interface WarmupRoutine {
  id: number;
  name: string;
  description: string;
  position: string; // posición específica o 'general'
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  totalDuration: number; // en minutos
  exercises: WarmupExercise[];
  benefits: string[];
  completed: boolean;
}

/**
 * Componente WarmupRoutines - Rutinas de calentamiento personalizadas
 * Proporciona rutinas específicas según la posición del jugador
 */
@Component({
  selector: 'app-warmup-routines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './warmup-routines.component.html',
  styleUrls: ['./warmup-routines.component.css']
})
export class WarmupRoutinesComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  selectedPosition = 'general';
  selectedDifficulty = 'todas';
  isRoutineActive = false;
  activeRoutine: WarmupRoutine | null = null;
  currentExerciseIndex = 0;
  exerciseTimer = 0;
  timerInterval: any;

  // Opciones de filtros
  positions = [
    { value: 'general', label: 'General' },
    { value: 'portero', label: 'Portero' },
    { value: 'defensa', label: 'Defensa' },
    { value: 'mediocampo', label: 'Mediocampo' },
    { value: 'delantero', label: 'Delantero' }
  ];

  difficulties = [
    { value: 'todas', label: 'Todas las dificultades' },
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];

  // Datos mock de rutinas de calentamiento
  allRoutines: WarmupRoutine[] = [
    {
      id: 1,
      name: 'Calentamiento General Pre-Entreno',
      description: 'Rutina básica de calentamiento para todos los jugadores antes del entrenamiento.',
      position: 'general',
      difficulty: 'principiante',
      totalDuration: 15,
      completed: false,
      benefits: [
        'Aumenta la temperatura corporal',
        'Mejora la flexibilidad',
        'Prepara articulaciones',
        'Reduce riesgo de lesiones'
      ],
      exercises: [
        {
          id: 1,
          name: 'Trote Suave',
          description: 'Trote ligero para activar el sistema cardiovascular',
          duration: 300, // 5 minutos
          instructions: [
            'Mantén un ritmo cómodo y constante',
            'Respira de manera natural',
            'Mantén postura erguida'
          ]
        },
        {
          id: 2,
          name: 'Movimientos Articulares',
          description: 'Rotaciones y movimientos para activar articulaciones',
          duration: 240, // 4 minutos
          instructions: [
            'Rota la cabeza suavemente en ambas direcciones',
            'Realiza círculos con los brazos',
            'Rota caderas y rodillas',
            'Realiza movimientos de tobillos'
          ]
        },
        {
          id: 3,
          name: 'Elevación de Rodillas',
          description: 'Activación de músculos del core y piernas',
          duration: 120, // 2 minutos
          repetitions: 20,
          instructions: [
            'Eleva las rodillas alternadamente hasta la altura de la cadera',
            'Mantén el torso recto',
            'Coordina con el movimiento de brazos'
          ]
        },
        {
          id: 4,
          name: 'Talones al Glúteo',
          description: 'Activación de isquiotibiales',
          duration: 120, // 2 minutos
          repetitions: 20,
          instructions: [
            'Lleva los talones hacia los glúteos alternadamente',
            'Mantén la postura erguida',
            'Controla el movimiento'
          ]
        },
        {
          id: 5,
          name: 'Zancadas Dinámicas',
          description: 'Estiramiento dinámico de piernas',
          duration: 120, // 2 minutos
          repetitions: 10,
          instructions: [
            'Realiza zancadas largas alternando piernas',
            'Mantén la rodilla posterior cerca del suelo',
            'Impulsa con la pierna de adelante para volver al centro'
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Calentamiento Específico para Porteros',
      description: 'Rutina especializada que enfatiza flexibilidad y reflejos para porteros.',
      position: 'portero',
      difficulty: 'intermedio',
      totalDuration: 20,
      completed: true,
      benefits: [
        'Mejora reflejos y agilidad',
        'Fortalece muñecas y antebrazos',
        'Aumenta flexibilidad de cadera',
        'Prepara para movimientos explosivos'
      ],
      exercises: [
        {
          id: 6,
          name: 'Movilidad de Muñecas',
          description: 'Ejercicios específicos para preparar muñecas y antebrazos',
          duration: 180,
          instructions: [
            'Rota las muñecas en ambas direcciones',
            'Flexiona y extiende las muñecas',
            'Realiza ejercicios de agarre'
          ]
        },
        {
          id: 7,
          name: 'Desplazamientos Laterales',
          description: 'Movimientos laterales para mejorar agilidad',
          duration: 300,
          instructions: [
            'Desplázate lateralmente manteniendo posición de portero',
            'Alterna dirección cada 5 segundos',
            'Mantén vista al frente'
          ]
        },
        {
          id: 8,
          name: 'Saltos y Aterrizajes',
          description: 'Ejercicios pliométricos para potencia',
          duration: 240,
          repetitions: 15,
          instructions: [
            'Realiza saltos verticales controlados',
            'Aterriza suavemente con ambos pies',
            'Mantén equilibrio al aterrizar'
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Calentamiento para Delanteros',
      description: 'Rutina enfocada en velocidad y cambios de dirección.',
      position: 'delantero',
      difficulty: 'avanzado',
      totalDuration: 18,
      completed: false,
      benefits: [
        'Mejora velocidad de reacción',
        'Aumenta potencia explosiva',
        'Optimiza cambios de dirección',
        'Prepara para sprints'
      ],
      exercises: [
        {
          id: 9,
          name: 'Sprints Progresivos',
          description: 'Aceleraciones graduales para activar músculos de velocidad',
          duration: 360,
          instructions: [
            'Comienza con trote ligero',
            'Aumenta gradualmente la velocidad',
            'Termina con sprint de 10 metros'
          ]
        },
        {
          id: 10,
          name: 'Ejercicios de Agilidad',
          description: 'Movimientos multidireccionales',
          duration: 300,
          instructions: [
            'Realiza movimientos en zigzag',
            'Cambia de dirección rápidamente',
            'Mantén el control corporal'
          ]
        }
      ]
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
        // Configurar filtro inicial basado en la posición del usuario
        if (user.position) {
          this.selectedPosition = user.position;
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Obtener posición del usuario de forma segura
   * @returns string - Posición del usuario o 'general' por defecto
   */
  getUserPosition(): string {
    return this.currentUser?.position || 'general';
  }

  /**
   * Obtener nombre del usuario de forma segura
   * @returns string - Nombre del usuario o 'Usuario' por defecto
   */
  getUserName(): string {
    return this.currentUser?.name || 'Usuario';
  }

  /**
   * Verificar si el usuario tiene una posición específica
   * @returns boolean - True si el usuario tiene una posición definida
   */
  hasUserPosition(): boolean {
    return !!(this.currentUser?.position);
  }

  /**
   * Obtener rutinas filtradas
   */
  get filteredRoutines(): WarmupRoutine[] {
    return this.allRoutines.filter(routine => {
      const positionMatch = this.selectedPosition === 'general' ||
      routine.position === 'general' ||
      routine.position === this.selectedPosition;
      const difficultyMatch = this.selectedDifficulty === 'todas' ||
      routine.difficulty === this.selectedDifficulty;
      return positionMatch && difficultyMatch;
    });
  }

  /**
   * Iniciar rutina de calentamiento
   */
  startRoutine(routine: WarmupRoutine): void {
    this.activeRoutine = routine;
    this.isRoutineActive = true;
    this.currentExerciseIndex = 0;
    this.exerciseTimer = routine.exercises[0].duration;
    this.startTimer();
  }

  /**
   * Pausar rutina actual
   */
  pauseRoutine(): void {
    this.clearTimer();
  }

  /**
   * Reanudar rutina pausada
   */
  resumeRoutine(): void {
    this.startTimer();
  }

  /**
   * Finalizar rutina actual
   */
  finishRoutine(): void {
    this.clearTimer();
    if (this.activeRoutine) {
      this.activeRoutine.completed = true;
    }
    this.isRoutineActive = false;
    this.activeRoutine = null;
    this.currentExerciseIndex = 0;
  }

  /**
   * Pasar al siguiente ejercicio
   */
  nextExercise(): void {
    if (this.activeRoutine && this.currentExerciseIndex < this.activeRoutine.exercises.length - 1) {
      this.currentExerciseIndex++;
      this.exerciseTimer = this.activeRoutine.exercises[this.currentExerciseIndex].duration;
    } else {
      this.finishRoutine();
    }
  }

  /**
   * Volver al ejercicio anterior
   */
  previousExercise(): void {
    if (this.currentExerciseIndex > 0) {
      this.currentExerciseIndex--;
      this.exerciseTimer = this.activeRoutine!.exercises[this.currentExerciseIndex].duration;
    }
  }

  /**
   * Iniciar temporizador
   */
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.exerciseTimer--;
      if (this.exerciseTimer <= 0) {
        this.nextExercise();
      }
    }, 1000);
  }

  /**
   * Limpiar temporizador
   */
  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Obtener ejercicio actual
   */
  get currentExercise(): WarmupExercise | null {
    if (this.activeRoutine && this.currentExerciseIndex < this.activeRoutine.exercises.length) {
      return this.activeRoutine.exercises[this.currentExerciseIndex];
    }
    return null;
  }

  /**
   * Formatear tiempo en formato MM:SS
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Obtener clase CSS para dificultad
   */
  getDifficultyClass(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'principiante':
        return 'bg-green-100 text-green-800';
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800';
      case 'avanzado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtener progreso de la rutina actual
   */
  get routineProgress(): number {
    if (!this.activeRoutine) return 0;
    return Math.round(((this.currentExerciseIndex + 1) / this.activeRoutine.exercises.length) * 100);
  }

  /**
   * Navegar de regreso
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Limpiar intervalos al destruir componente
   */
  ngOnDestroy(): void {
    this.clearTimer();
  }
}
