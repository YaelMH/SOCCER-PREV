import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe'; // ajusta ruta si es otra
import { AuthService } from '../../auth/auth.service';           // 👈 IMPORTANTE

type WarmupType = 'pre_partido' | 'pre_entreno' | 'recuperacion';
type PlayerPosition = 'general' | 'portero' | 'defensa' | 'medio' | 'delantero';

interface WarmupStep {
  order: number;
  title: string;
  duration: string;
  description: string;
}

interface WarmupRoutine {
  id: string;
  name: string;
  type: WarmupType;
  totalTime: string;
  focusZone: string;
  level: 'básico' | 'intermedio' | 'avanzado';
  position: PlayerPosition;
  videoUrl: string;
  steps: WarmupStep[];
}

@Component({
  selector: 'app-warmup',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './warmup.component.html',
  styleUrl: './warmup.component.css'
})
export class WarmupComponent {

  private authService = inject(AuthService);

  // 👇 Rutina seleccionada en el panel derecho
  selectedRoutineId: string | null = null;

  // 👇 Datos del usuario (se rellenan desde Firebase)
  userPosition: PlayerPosition = 'general';
  userLevel: 'básico' | 'intermedio' | 'avanzado' = 'básico';
  profileLoaded = false; // por si quieres mostrar un loader luego

  // 👇 Filtros para la lista general
  selectedPositionFilter: PlayerPosition | 'todas' = 'todas';
  selectedLevelFilter: 'todos' | 'básico' | 'intermedio' | 'avanzado' = 'todos';

  positionOptions: { value: PlayerPosition | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas las posiciones' },
    { value: 'general', label: 'Generales' },
    { value: 'portero', label: 'Portero' },
    { value: 'defensa', label: 'Defensa' },
    { value: 'medio', label: 'Mediocampista' },
    { value: 'delantero', label: 'Delantero' }
  ];

  levelOptions: { value: 'todos' | 'básico' | 'intermedio' | 'avanzado'; label: string }[] = [
    { value: 'todos', label: 'Todos los niveles' },
    { value: 'básico', label: 'Básico' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  // aquí simulo las rutinas que el sistema ofrece (después las consumo de backend)
  routines: WarmupRoutine[] = [
  // =========================
  // GENERALES – BÁSICO
  // =========================
  {
    id: 'gen_b1',
    name: 'Calentamiento general básico pre-partido (10 min)',
    type: 'pre_partido',
    totalTime: '10 min',
    focusZone: 'Cuerpo completo',
    level: 'básico',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/CNrrGKUJRd8',
    steps: [
      {
        order: 1,
        title: 'Trote suave alrededor de la cancha',
        duration: '3 min',
        description: 'Trote ligero para elevar la temperatura corporal sin fatigarte.'
      },
      {
        order: 2,
        title: 'Movilidad articular general',
        duration: '4 min',
        description: 'Rotaciones de tobillos, rodillas, cadera, hombros y cuello con control.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos suaves',
        duration: '3 min',
        description: 'Desplantes cortos, elevación de rodillas y talones a glúteos a baja intensidad.'
      }
    ]
  },
  {
    id: 'gen_b2',
    name: 'Calentamiento general básico pre-entrenamiento (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y zona media',
    level: 'básico',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/CNrrGKUJRd8',
    steps: [
      {
        order: 1,
        title: 'Caminata rápida y trote suave',
        duration: '4 min',
        description: 'Comienza caminando rápido 2 min y termina con trote suave 2 min.'
      },
      {
        order: 2,
        title: 'Movilidad de cadera y columna',
        duration: '4 min',
        description: 'Círculos de cadera, flexión y extensión suave de columna.'
      },
      {
        order: 3,
        title: 'Skipping bajo y talones a glúteos',
        duration: '4 min',
        description: '20s de skipping bajo, 20s de talones a glúteos, alternando hasta completar.'
      }
    ]
  },
  {
    id: 'gen_b3',
    name: 'Recuperación general básica post-partido (8 min)',
    type: 'recuperacion',
    totalTime: '8 min',
    focusZone: 'Piernas',
    level: 'básico',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/CNrrGKUJRd8',
    steps: [
      {
        order: 1,
        title: 'Caminata suave',
        duration: '3 min',
        description: 'Caminata tranquila para bajar pulsaciones de forma progresiva.'
      },
      {
        order: 2,
        title: 'Estiramientos estáticos de piernas',
        duration: '5 min',
        description: 'Cuádriceps, isquiotibiales y pantorrillas, 20–30 segundos cada estiramiento.'
      }
    ]
  },

  // =========================
  // GENERALES – INTERMEDIO
  // =========================
  {
    id: 'gen_i1',
    name: 'Activación dinámica general pre-partido (15 min)',
    type: 'pre_partido',
    totalTime: '15 min',
    focusZone: 'Cuerpo completo',
    level: 'intermedio',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_I1',
    steps: [
      {
        order: 1,
        title: 'Trote con cambios de ritmo',
        duration: '5 min',
        description: 'Alterna 30s de trote suave con 30s de trote más rápido.'
      },
      {
        order: 2,
        title: 'Movilidad articular dinámica',
        duration: '4 min',
        description: 'Círculos amplios de brazos, rodillas y cadera con desplazamiento hacia adelante.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de piernas',
        duration: '6 min',
        description: 'Desplantes caminando, zancadas laterales y skipping medio.'
      }
    ]
  },
  {
    id: 'gen_i2',
    name: 'Calentamiento general intermedio pre-entrenamiento (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y zona media',
    level: 'intermedio',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_I2',
    steps: [
      {
        order: 1,
        title: 'Trote con cambios de dirección',
        duration: '4 min',
        description: 'Corre en línea recta e incluye giros de 90° y 180° de forma controlada.'
      },
      {
        order: 2,
        title: 'Skipping medio y talones a glúteos',
        duration: '4 min',
        description: 'Alterna 30s de cada ejercicio manteniendo técnica y postura.'
      },
      {
        order: 3,
        title: 'Desplantes con rotación de tronco',
        duration: '4 min',
        description: 'Desplante frontal y rotación suave hacia la pierna adelantada.'
      }
    ]
  },
  {
    id: 'gen_i3',
    name: 'Recuperación activa intermedia post-partido (10 min)',
    type: 'recuperacion',
    totalTime: '10 min',
    focusZone: 'Piernas y zona lumbar',
    level: 'intermedio',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_I3',
    steps: [
      {
        order: 1,
        title: 'Caminata + respiración controlada',
        duration: '4 min',
        description: 'Caminata suave enfocando inhalaciones profundas por nariz y exhalaciones largas.'
      },
      {
        order: 2,
        title: 'Estiramientos de cadera y zona lumbar',
        duration: '3 min',
        description: 'Postura del corredor y flexión de tronco hacia adelante de forma relajada.'
      },
      {
        order: 3,
        title: 'Estiramientos de cadena posterior',
        duration: '3 min',
        description: 'Talón sobre banca y flexión de tronco hacia la pierna estirada, sin rebotes.'
      }
    ]
  },

  // =========================
  // GENERALES – AVANZADO
  // =========================
  {
    id: 'gen_a1',
    name: 'Calentamiento general avanzado pre-partido (15 min)',
    type: 'pre_partido',
    totalTime: '15 min',
    focusZone: 'Cuerpo completo',
    level: 'avanzado',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_A1',
    steps: [
      {
        order: 1,
        title: 'Trote con cambios de ritmo y dirección',
        duration: '5 min',
        description: 'Incluye aceleraciones cortas, frenadas y cambios de dirección a los lados.'
      },
      {
        order: 2,
        title: 'Circuito de movilidad dinámica',
        duration: '5 min',
        description: 'Desplantes, zancadas laterales y skipping alto con desplazamiento en zigzag.'
      },
      {
        order: 3,
        title: 'Aceleraciones progresivas',
        duration: '5 min',
        description: 'Carreras de 15–20m aumentando la velocidad en cada repetición.'
      }
    ]
  },
  {
    id: 'gen_a2',
    name: 'Activación explosiva avanzada pre-entrenamiento (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y potencia',
    level: 'avanzado',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_A2',
    steps: [
      {
        order: 1,
        title: 'Skipping alto intenso',
        duration: '4 min',
        description: 'Rodillas arriba a buena velocidad, manteniendo técnica de brazos.'
      },
      {
        order: 2,
        title: 'Saltos pliométricos suaves',
        duration: '4 min',
        description: 'Saltos verticales y laterales con buena amortiguación de rodillas y cadera.'
      },
      {
        order: 3,
        title: 'Sprints cortos',
        duration: '4 min',
        description: 'Sprints de 10–15m con retorno caminando para no acumular fatiga excesiva.'
      }
    ]
  },
  {
    id: 'gen_a3',
    name: 'Recuperación avanzada post-entrenamiento intenso (12 min)',
    type: 'recuperacion',
    totalTime: '12 min',
    focusZone: 'Piernas y zona media',
    level: 'avanzado',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_A3',
    steps: [
      {
        order: 1,
        title: 'Caminata + respiración diafragmática',
        duration: '4 min',
        description: 'Céntrate en respirar profundo llevando el aire al abdomen.'
      },
      {
        order: 2,
        title: 'Estiramientos profundos de cadera y glúteos',
        duration: '4 min',
        description: 'Mantén 30–40s cada postura, sintiendo estiramiento sin dolor.'
      },
      {
        order: 3,
        title: 'Estiramientos de cuádriceps e isquiotibiales',
        duration: '4 min',
        description: 'Apóyate en una pared o compañero para mantener estabilidad.'
      }
    ]
  },
  {
    id: 'gen_a4',
    name: 'Reset general avanzado día posterior al partido (10 min)',
    type: 'recuperacion',
    totalTime: '10 min',
    focusZone: 'Cuerpo completo',
    level: 'avanzado',
    position: 'general',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GEN_A4',
    steps: [
      {
        order: 1,
        title: 'Caminata + movilidad muy suave',
        duration: '5 min',
        description: 'Caminata con movimientos amplios pero relajados de brazos y cadera.'
      },
      {
        order: 2,
        title: 'Estiramientos globales de cadena anterior y posterior',
        duration: '5 min',
        description: 'Combina estiramientos de brazos, tronco y piernas en posiciones cómodas.'
      }
    ]
  },
    // =========================
  // PORTERO – BÁSICO (2)
  // =========================
  {
    id: 'gk_b1',
    name: 'Portero básico – manejo de balón y postura (10 min)',
    type: 'pre_entreno',
    totalTime: '10 min',
    focusZone: 'Brazos y tronco',
    level: 'básico',
    position: 'portero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GK_B1',
    steps: [
      {
        order: 1,
        title: 'Movilidad de hombros y muñecas',
        duration: '3 min',
        description: 'Rotaciones suaves de hombros, codos y muñecas, adelante y atrás.'
      },
      {
        order: 2,
        title: 'Recepciones frontales al pecho',
        duration: '4 min',
        description: 'Compañero lanza balones suaves que se reciben al pecho con ambas manos.'
      },
      {
        order: 3,
        title: 'Pasos cortos en posición básica',
        duration: '3 min',
        description: 'Desplazamientos laterales cortos manteniendo rodillas semiflexionadas y manos al frente.'
      }
    ]
  },
  {
    id: 'gk_b2',
    name: 'Portero básico – blocajes bajos (12 min)',
    type: 'pre_partido',
    totalTime: '12 min',
    focusZone: 'Piernas y zona baja',
    level: 'básico',
    position: 'portero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GK_B2',
    steps: [
      {
        order: 1,
        title: 'Trote suave + pasos laterales',
        duration: '4 min',
        description: 'Trote alrededor del área chica incluyendo tramos con pasos laterales en semiflexión.'
      },
      {
        order: 2,
        title: 'Blocajes rasos controlados',
        duration: '4 min',
        description: 'Balones suaves a ras de piso hacia ambos lados, asegurando el balón con el cuerpo detrás.'
      },
      {
        order: 3,
        title: 'Caídas laterales desde rodillas',
        duration: '4 min',
        description: 'Práctica de la técnica de caída lateral sin impacto fuerte, rodilla y cadera controladas.'
      }
    ]
  },

  // =========================
  // PORTERO – INTERMEDIO (2)
  // =========================
  {
    id: 'gk_i1',
    name: 'Portero intermedio – caídas laterales y reflejos (14 min)',
    type: 'pre_entreno',
    totalTime: '14 min',
    focusZone: 'Lateralidad y reflejos',
    level: 'intermedio',
    position: 'portero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GK_I1',
    steps: [
      {
        order: 1,
        title: 'Saltos laterales cortos',
        duration: '4 min',
        description: 'Saltos suaves sobre una línea imaginaria para activar piernas y estabilidad lateral.'
      },
      {
        order: 2,
        title: 'Caídas laterales desde posición de pie',
        duration: '5 min',
        description: 'Desde posición básica, caída controlada hacia ambos lados acompañando el balón al piso.'
      },
      {
        order: 3,
        title: 'Balones sorpresa a corta distancia',
        duration: '5 min',
        description: 'Compañero lanza balones sin avisar previamente desde cerca, enfocado en reacción rápida.'
      }
    ]
  },
  {
    id: 'gk_i2',
    name: 'Portero intermedio – juego con los pies (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y control de balón',
    level: 'intermedio',
    position: 'portero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GK_I2',
    steps: [
      {
        order: 1,
        title: 'Pases cortos con compañero',
        duration: '4 min',
        description: 'Pases controlados con ambos pies usando el interior, manteniendo buena postura corporal.'
      },
      {
        order: 2,
        title: 'Recepción orientada y pase',
        duration: '4 min',
        description: 'Controla el balón y orienta el primer toque hacia el lado al que vas a pasar.'
      },
      {
        order: 3,
        title: 'Golpes largos controlados',
        duration: '4 min',
        description: 'Despejes largos a media potencia, priorizando técnica de golpeo y dirección.'
      }
    ]
  },

  // =========================
  // PORTERO – AVANZADO (2)
  // =========================
  {
    id: 'gk_a1',
    name: 'Portero avanzado – juego aéreo y potencia (15 min)',
    type: 'pre_partido',
    totalTime: '15 min',
    focusZone: 'Juego aéreo y saltos',
    level: 'avanzado',
    position: 'portero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GK_A1',
    steps: [
      {
        order: 1,
        title: 'Saltos verticales con balón',
        duration: '5 min',
        description: 'Saltos para atrapar el balón por encima de la cabeza, cayendo con buena base de apoyo.'
      },
      {
        order: 2,
        title: 'Centros desde bandas',
        duration: '5 min',
        description: 'Balones cruzados al área para practicar cálculo de trayectoria y momento de salto.'
      },
      {
        order: 3,
        title: 'Salidas en uno contra uno controladas',
        duration: '5 min',
        description: 'Simulación de salida rápida a balones filtrados, frenando con rodilla al frente y brazos abiertos.'
      }
    ]
  },
  {
    id: 'gk_a2',
    name: 'Portero avanzado – reflejos a corta distancia (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Reflejos y reacción',
    level: 'avanzado',
    position: 'portero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_GK_A2',
    steps: [
      {
        order: 1,
        title: 'Reacciones a balones rebotados',
        duration: '4 min',
        description: 'Disparos controlados que rebotan en una pared o conos, reaccionando al segundo balón.'
      },
      {
        order: 2,
        title: 'Doble blocaje',
        duration: '4 min',
        description: 'Primer tiro al pecho, segundo tiro raso inmediatamente después, enfocando técnica y tiempo.'
      },
      {
        order: 3,
        title: 'Disparos rápidos desde corta distancia',
        duration: '4 min',
        description: 'Tiros consecutivos dentro del área chica, priorizando colocación y tiempo de reacción.'
      }
    ]
  },
    // =========================
  // DEFENSA – BÁSICO (2)
  // =========================
  {
    id: 'def_b1',
    name: 'Defensa básico – desplazamientos laterales (10 min)',
    type: 'pre_entreno',
    totalTime: '10 min',
    focusZone: 'Piernas y zona media',
    level: 'básico',
    position: 'defensa',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_DEF_B1',
    steps: [
      {
        order: 1,
        title: 'Trote suave en línea',
        duration: '4 min',
        description: 'Activación general con trote recto a ritmo cómodo, preparando piernas y respiración.'
      },
      {
        order: 2,
        title: 'Desplazamientos laterales en semiflexión',
        duration: '3 min',
        description: 'Pasos laterales cortos manteniendo rodillas flexionadas y centro de gravedad bajo.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de aductores',
        duration: '3 min',
        description: 'Aperturas laterales suaves, sintiendo estiramiento interno del muslo sin rebotes.'
      }
    ]
  },
  {
    id: 'def_b2',
    name: 'Defensa básico – entradas controladas (12 min)',
    type: 'pre_partido',
    totalTime: '12 min',
    focusZone: 'Piernas y timing defensivo',
    level: 'básico',
    position: 'defensa',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_DEF_B2',
    steps: [
      {
        order: 1,
        title: 'Trote con cambios de dirección suaves',
        duration: '4 min',
        description: 'Simula seguir a un rival cambiando de dirección a baja intensidad.'
      },
      {
        order: 2,
        title: 'Entradas sin balón',
        duration: '4 min',
        description: 'Practica el gesto de la entrada sin tirarte al suelo, enfocándote en apoyar bien la pierna.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de isquios y glúteos',
        duration: '4 min',
        description: 'Desplantes frontales con énfasis en la pierna atrasada y ligera flexión de tronco.'
      }
    ]
  },

  // =========================
  // DEFENSA – INTERMEDIO (2)
  // =========================
  {
    id: 'def_i1',
    name: 'Defensa intermedio – cambios de dirección y cobertura (14 min)',
    type: 'pre_entreno',
    totalTime: '14 min',
    focusZone: 'Piernas y lectura de juego',
    level: 'intermedio',
    position: 'defensa',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_DEF_I1',
    steps: [
      {
        order: 1,
        title: 'Desplazamientos laterales con cambios de ritmo',
        duration: '5 min',
        description: 'Cubre una zona imaginaria acelerando y frenando, manteniendo postura defensiva.'
      },
      {
        order: 2,
        title: 'Carreras hacia atrás y adelante',
        duration: '5 min',
        description: 'Corre hacia atrás simulando repliegue y luego avanza rápido hacia el balón.'
      },
      {
        order: 3,
        title: 'Aceleraciones cortas hacia el balón',
        duration: '4 min',
        description: 'Sprints de 5–10m desde posición defensiva, atacando un cono o balón como referencia.'
      }
    ]
  },
  {
    id: 'def_i2',
    name: 'Defensa intermedio – duelos 1 vs 1 controlados (12 min)',
    type: 'pre_partido',
    totalTime: '12 min',
    focusZone: 'Piernas y zona media',
    level: 'intermedio',
    position: 'defensa',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_DEF_I2',
    steps: [
      {
        order: 1,
        title: 'Trote con cambios de dirección reactivos',
        duration: '4 min',
        description: 'Un compañero señala una dirección y el defensa reacciona de inmediato hacia ese lado.'
      },
      {
        order: 2,
        title: 'Duelos 1 vs 1 a media intensidad',
        duration: '4 min',
        description: 'Enfrenta a un atacante, cuidando distancia, pasos cortos y ángulo de salida.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos finales',
        duration: '4 min',
        description: 'Estiramientos activos de cuádriceps, isquios y glúteos para dejar la musculatura lista.'
      }
    ]
  },

  // =========================
  // DEFENSA – AVANZADO (2)
  // =========================
  {
    id: 'def_a1',
    name: 'Defensa avanzado – repliegue y salida rápida (15 min)',
    type: 'pre_partido',
    totalTime: '15 min',
    focusZone: 'Piernas y resistencia específica',
    level: 'avanzado',
    position: 'defensa',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_DEF_A1',
    steps: [
      {
        order: 1,
        title: 'Carreras diagonales de cobertura',
        duration: '5 min',
        description: 'Corre en diagonal simulando cubrir a un compañero que fue superado.'
      },
      {
        order: 2,
        title: 'Repliegue rápido y salida',
        duration: '5 min',
        description: 'Corre hacia atrás desde la línea media, luego sprint hacia adelante para achicar espacios.'
      },
      {
        order: 3,
        title: '1 vs 1 a alta intensidad controlada',
        duration: '5 min',
        description: 'Duelos intensos enfocándote en el momento de la entrada y el uso del cuerpo sin falta.'
      }
    ]
  },
  {
    id: 'def_a2',
    name: 'Defensa avanzado – juego aéreo defensivo (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y tronco superior',
    level: 'avanzado',
    position: 'defensa',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_DEF_A2',
    steps: [
      {
        order: 1,
        title: 'Saltos verticales con impulso corto',
        duration: '4 min',
        description: 'Saltos verticales atacando el balón imaginario en el punto más alto.'
      },
      {
        order: 2,
        title: 'Duelos aéreos controlados',
        duration: '4 min',
        description: 'Choques suaves con un compañero al disputar balones altos, cuidando el uso de brazos.'
      },
      {
        order: 3,
        title: 'Estiramientos de cuello y hombros',
        duration: '4 min',
        description: 'Movilidad suave y estiramientos después del trabajo de saltos y contactos.'
      }
    ]
  },
    // =========================
  // MEDIOCAMPISTA – BÁSICO (2)
  // =========================
  {
    id: 'mid_b1',
    name: 'Medio básico – control y pase corto (10 min)',
    type: 'pre_entreno',
    totalTime: '10 min',
    focusZone: 'Piernas y zona media',
    level: 'básico',
    position: 'medio',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_MID_B1',
    steps: [
      {
        order: 1,
        title: 'Trote suave en rombo',
        duration: '4 min',
        description: 'Corre formando un rombo alrededor de conos, cambiando de dirección suavemente.'
      },
      {
        order: 2,
        title: 'Pases cortos en parejas',
        duration: '3 min',
        description: 'Pases a corta distancia usando el interior del pie, enfocándote en precisión y orientación.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de cadera',
        duration: '3 min',
        description: 'Zancadas frontales y laterales controladas, activando zona de cadera y glúteos.'
      }
    ]
  },
  {
    id: 'mid_b2',
    name: 'Medio básico – movilidad general con balón (12 min)',
    type: 'pre_partido',
    totalTime: '12 min',
    focusZone: 'Piernas y coordinación',
    level: 'básico',
    position: 'medio',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_MID_B2',
    steps: [
      {
        order: 1,
        title: 'Conducción suave en zigzag',
        duration: '4 min',
        description: 'Conduce el balón entre conos a velocidad baja, usando ambos pies.'
      },
      {
        order: 2,
        title: 'Pases de pared con compañero',
        duration: '4 min',
        description: 'Realiza pases cortos y devuelve de primera, trabajando control y pase.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de isquios',
        duration: '4 min',
        description: 'Flexión de tronco llevando manos a la punta del pie adelantado, alternando piernas.'
      }
    ]
  },

  // =========================
  // MEDIOCAMPISTA – INTERMEDIO (2)
  // =========================
  {
    id: 'mid_i1',
    name: 'Medio intermedio – cambios de ritmo con balón (14 min)',
    type: 'pre_entreno',
    totalTime: '14 min',
    focusZone: 'Piernas y resistencia',
    level: 'intermedio',
    position: 'medio',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_MID_I1',
    steps: [
      {
        order: 1,
        title: 'Conducción con cambios de ritmo',
        duration: '5 min',
        description: 'Alterna conducción lenta y rápida en tramos de 10–15m, manteniendo el balón pegado al pie.'
      },
      {
        order: 2,
        title: 'Giros con balón',
        duration: '4 min',
        description: 'Recibe el balón, gira 180° y pasa a otro compañero, simulando cambio de orientación.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de aductores',
        duration: '5 min',
        description: 'Desplazamientos laterales amplios sintiendo el estiramiento interno del muslo.'
      }
    ]
  },
  {
    id: 'mid_i2',
    name: 'Medio intermedio – presión y coberturas (12 min)',
    type: 'pre_partido',
    totalTime: '12 min',
    focusZone: 'Piernas y cardio',
    level: 'intermedio',
    position: 'medio',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_MID_I2',
    steps: [
      {
        order: 1,
        title: 'Trote en zonas con cambios de dirección',
        duration: '4 min',
        description: 'Muévete entre “zona defensiva y ofensiva” marcada por conos, cambiando de dirección.'
      },
      {
        order: 2,
        title: 'Entradas suaves al poseedor del balón',
        duration: '4 min',
        description: 'Acércate, frena y roba el balón a media intensidad, cuidando la postura de piernas.'
      },
      {
        order: 3,
        title: 'Estiramientos de cuádriceps y glúteos',
        duration: '4 min',
        description: 'Estiramientos mantenidos de 20–30 segundos por pierna, con apoyo en pared si es necesario.'
      }
    ]
  },

  // =========================
  // MEDIOCAMPISTA – AVANZADO (2)
  // =========================
  {
    id: 'mid_a1',
    name: 'Medio avanzado – alta intensidad con balón (15 min)',
    type: 'pre_partido',
    totalTime: '15 min',
    focusZone: 'Piernas y zona media',
    level: 'avanzado',
    position: 'medio',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_MID_A1',
    steps: [
      {
        order: 1,
        title: 'Conducción intensa en espacio reducido',
        duration: '5 min',
        description: 'Maneja el balón en un cuadrado pequeño con cambios rápidos de dirección y ritmo.'
      },
      {
        order: 2,
        title: 'Pases largos y cambios de orientación',
        duration: '5 min',
        description: 'Envía balones a bandas alternando piernas, simulando cambios de juego.'
      },
      {
        order: 3,
        title: 'Pressing corto y regreso a posición',
        duration: '5 min',
        description: 'Corre hacia un cono (poseedor), presiona y regresa rápido a tu posición inicial.'
      }
    ]
  },
  {
    id: 'mid_a2',
    name: 'Medio avanzado – presión tras pérdida (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y resistencia anaeróbica',
    level: 'avanzado',
    position: 'medio',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_MID_A2',
    steps: [
      {
        order: 1,
        title: 'Sprints cortos hacia conos',
        duration: '4 min',
        description: 'Parte desde el centro y corre hacia diferentes conos marcados, cambiando dirección rápido.'
      },
      {
        order: 2,
        title: 'Recuperación y pase inmediato',
        duration: '4 min',
        description: 'Simula robo de balón y realiza un pase rápido al compañero en apoyo.'
      },
      {
        order: 3,
        title: 'Estiramientos finales dinámicos',
        duration: '4 min',
        description: 'Estiramientos activos de todo el tren inferior para mantener ligera activación.'
      }
    ]
  },
    // =========================
  // DELANTERO – BÁSICO (2)
  // =========================
  {
    id: 'fw_b1',
    name: 'Delantero básico – movilidad y definición suave (10 min)',
    type: 'pre_entreno',
    totalTime: '10 min',
    focusZone: 'Piernas y coordinación',
    level: 'básico',
    position: 'delantero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_FW_B1',
    steps: [
      {
        order: 1,
        title: 'Trote suave en diagonales',
        duration: '4 min',
        description: 'Corre en diagonales cortas simulando desmarques hacia bandas y centro.'
      },
      {
        order: 2,
        title: 'Conducción suave y tiros suaves',
        duration: '3 min',
        description: 'Conduce el balón unos metros y realiza disparos suaves a portería, priorizando técnica.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de cadera y cuádriceps',
        duration: '3 min',
        description: 'Desplantes frontales con foco en pierna de apoyo y ligera extensión de cadera.'
      }
    ]
  },
  {
    id: 'fw_b2',
    name: 'Delantero básico – cambios de dirección con balón (12 min)',
    type: 'pre_partido',
    totalTime: '12 min',
    focusZone: 'Piernas y zona media',
    level: 'básico',
    position: 'delantero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_FW_B2',
    steps: [
      {
        order: 1,
        title: 'Trote con desmarques cortos',
        duration: '4 min',
        description: 'Simula desmarques hacia primer y segundo palo a baja intensidad sin balón.'
      },
      {
        order: 2,
        title: 'Conducción y tiro desde corta distancia',
        duration: '4 min',
        description: 'Conduce el balón 5–10m y define suave al arco, alternando pierna dominante y no dominante.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de isquios',
        duration: '4 min',
        description: 'Movimientos de pierna adelante-atrás controlados, activando cadena posterior.'
      }
    ]
  },

  // =========================
  // DELANTERO – INTERMEDIO (2)
  // =========================
  {
    id: 'fw_i1',
    name: 'Delantero intermedio – desmarques y definición (14 min)',
    type: 'pre_partido',
    totalTime: '14 min',
    focusZone: 'Piernas y explosividad',
    level: 'intermedio',
    position: 'delantero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_FW_I1',
    steps: [
      {
        order: 1,
        title: 'Sprints cortos con cambio de dirección',
        duration: '5 min',
        description: 'Sprints de 5–10m simulando desmarques en diagonal, cambiando de dirección rápido.'
      },
      {
        order: 2,
        title: 'Recepción orientada y tiro',
        duration: '5 min',
        description: 'Recibe pase, orienta el control hacia portería y dispara con intensidad media.'
      },
      {
        order: 3,
        title: 'Estiramientos dinámicos de cadera y glúteos',
        duration: '4 min',
        description: 'Movimientos amplios de cadera y estiramientos activos de glúteos alternando piernas.'
      }
    ]
  },
  {
    id: 'fw_i2',
    name: 'Delantero intermedio – definición tras centro (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y coordinación',
    level: 'intermedio',
    position: 'delantero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_FW_I2',
    steps: [
      {
        order: 1,
        title: 'Desmarques al primer y segundo poste',
        duration: '4 min',
        description: 'Movimientos sin balón hacia primer y segundo palo, sincronizando con el “centro imaginario”.'
      },
      {
        order: 2,
        title: 'Centros suaves y remates controlados',
        duration: '4 min',
        description: 'Remata balones suaves con interior o empeine, priorizando colocación sobre potencia.'
      },
      {
        order: 3,
        title: 'Estiramientos de cuádriceps e isquios',
        duration: '4 min',
        description: 'Estiramientos mantenidos 20–30s por pierna, ayudándote de un apoyo para el equilibrio.'
      }
    ]
  },

  // =========================
  // DELANTERO – AVANZADO (2)
  // =========================
  {
    id: 'fw_a1',
    name: 'Delantero avanzado – sprints y definición intensa (15 min)',
    type: 'pre_partido',
    totalTime: '15 min',
    focusZone: 'Piernas y potencia',
    level: 'avanzado',
    position: 'delantero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_FW_A1',
    steps: [
      {
        order: 1,
        title: 'Sprints explosivos en corto',
        duration: '5 min',
        description: 'Sprints de 10–15m desde parado, simulando atacar al espacio a máxima intensidad controlada.'
      },
      {
        order: 2,
        title: 'Definición tras cambio de ritmo',
        duration: '5 min',
        description: 'Desmarque, cambio de ritmo, control orientado y tiro fuerte a portería.'
      },
      {
        order: 3,
        title: 'Estiramientos finales activos',
        duration: '5 min',
        description: 'Estiramientos dinámicos de todo el tren inferior para mantener activación sin perder movilidad.'
      }
    ]
  },
  {
    id: 'fw_a2',
    name: 'Delantero avanzado – remates aéreos (12 min)',
    type: 'pre_entreno',
    totalTime: '12 min',
    focusZone: 'Piernas y tronco superior',
    level: 'avanzado',
    position: 'delantero',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_FW_A2',
    steps: [
      {
        order: 1,
        title: 'Saltos con cambio de dirección',
        duration: '4 min',
        description: 'Saltos hacia diferentes direcciones simulando atacar el espacio antes del centro.'
      },
      {
        order: 2,
        title: 'Centros y remates de cabeza controlados',
        duration: '4 min',
        description: 'Remates de cabeza a media intensidad, cuidando tiempo de salto y caída estable.'
      },
      {
        order: 3,
        title: 'Estiramientos de cuello y hombros',
        duration: '4 min',
        description: 'Movilidad y estiramientos suaves de cuello y zona de hombros tras los remates aéreos.'
      }
    ]
  }
];
 constructor() {
    this.loadUserProfileFromFirebase();
  }

  // =========================
  // Cargar perfil desde Firebase
  // =========================
  private loadUserProfileFromFirebase() {
    // 1. Escuchamos los cambios de auth para obtener el uid
    this.authService.authChanges().subscribe(user => {
      if (!user) {
        console.warn('[Warmup] No hay usuario logueado, se usan valores por defecto.');
        this.profileLoaded = true;
        return;
      }

      // 2. Con el uid, leemos el documento en 'users/{uid}'
      this.authService.getUserData(user.uid).subscribe(profile => {
        if (!profile) {
          console.warn('[Warmup] No se encontró perfil en Firestore.');
          this.profileLoaded = true;
          return;
        }

        // position viene como 'Portero', 'Defensa', 'Mediocentro', 'Delantero'
        if (profile.position) {
          this.userPosition = this.mapPositionFromProfile(profile.position);
        }

        // level viene como 'básico' | 'intermedio' | 'avanzado'
        if (profile.level === 'básico' || profile.level === 'intermedio' || profile.level === 'avanzado') {
          this.userLevel = profile.level;
        }

        // (Opcional pero cool) inicializar filtros con su perfil
        this.selectedPositionFilter = this.userPosition;
        this.selectedLevelFilter = this.userLevel;

        console.log('[Warmup] Perfil cargado:', {
          positionDb: profile.position,
          levelDb: profile.level,
          userPosition: this.userPosition,
          userLevel: this.userLevel
        });

        this.profileLoaded = true;
      });
    });
  }

  // Mapea texto de la BD a tu enum interno de posición
  private mapPositionFromProfile(positionDb: string): PlayerPosition {
    switch (positionDb) {
      case 'Portero':
        return 'portero';
      case 'Defensa':
        return 'defensa';
      case 'Mediocentro':
        return 'medio';
      case 'Delantero':
        return 'delantero';
      default:
        return 'general';
    }
  }

  // =========================
  // LÓGICA DE RECOMENDACIÓN
  // =========================

  // 🔹 Rutinas recomendadas según posición y nivel del jugador
  get recommendedRoutines(): WarmupRoutine[] {
    return this.routines
      .filter(r => {
        // posición: siempre mostrar generales + su posición
        const posOk =
          r.position === this.userPosition || r.position === 'general';

        // nivel:
        // - básico: solo básico
        // - intermedio: básico + intermedio
        // - avanzado: intermedio + avanzado
        let levelOk = false;
        if (this.userLevel === 'básico') {
          levelOk = r.level === 'básico';
        } else if (this.userLevel === 'intermedio') {
          levelOk = r.level === 'básico' || r.level === 'intermedio';
        } else {
          levelOk = r.level === 'intermedio' || r.level === 'avanzado';
        }

        return posOk && levelOk;
      })
      .slice(0, 5); // mostramos máximo 5 para no saturar
  }

  // 🔹 Rutinas filtradas para la lista general (usa filtros del usuario)
  get filteredRoutines(): WarmupRoutine[] {
    return this.routines.filter(r => {
      const positionOk =
        this.selectedPositionFilter === 'todas' ||
        r.position === this.selectedPositionFilter;

      const levelOk =
        this.selectedLevelFilter === 'todos' ||
        r.level === this.selectedLevelFilter;

      return positionOk && levelOk;
    });
  }

  // 🔹 Rutina seleccionada para el panel derecho
  get selectedRoutine(): WarmupRoutine | null {
    return this.routines.find(r => r.id === this.selectedRoutineId) ?? null;
  }

  // 🔹 Al hacer clic en una rutina
  selectRoutine(id: string) {
    this.selectedRoutineId = id;
  }

  // 🔹 Etiqueta legible para el tipo
  getTypeLabel(type: WarmupType): string {
    switch (type) {
      case 'pre_partido':
        return 'Pre-partido';
      case 'pre_entreno':
        return 'Pre-entrenamiento';
      case 'recuperacion':
        return 'Recuperación';
      default:
        return '';
    }
  }
}