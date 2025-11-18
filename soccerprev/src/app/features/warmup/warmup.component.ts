import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type WarmupType = 'pre_partido' | 'pre_entreno' | 'recuperacion';

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
  steps: WarmupStep[];
}

@Component({
  selector: 'app-warmup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warmup.component.html',
  styleUrl: './warmup.component.css'
})
export class WarmupComponent {
  // aquí guardo la rutina seleccionada
  selectedRoutineId: string | null = null;

  // aquí simulo las rutinas que el sistema ofrece (después las consumo de backend)
  routines: WarmupRoutine[] = [
    {
      id: 'r1',
      name: 'Calentamiento general pre-partido (15 min)',
      type: 'pre_partido',
      totalTime: '15 min',
      focusZone: 'Cuerpo completo',
      level: 'básico',
      steps: [
        {
          order: 1,
          title: 'Trote suave',
          duration: '4 min',
          description: 'Trote ligero alrededor de la cancha para elevar la temperatura corporal.'
        },
        {
          order: 2,
          title: 'Movilidad articular',
          duration: '5 min',
          description: 'Rotaciones de tobillos, rodillas, cadera, hombros y cuello.'
        },
        {
          order: 3,
          title: 'Estiramientos dinámicos',
          duration: '6 min',
          description: 'Desplantes, skipping, talones a glúteos y elevación de rodillas.'
        }
      ]
    },
    {
      id: 'r2',
      name: 'Rutina específica para defensas (10 min)',
      type: 'pre_entreno',
      totalTime: '10 min',
      focusZone: 'Piernas / zona media',
      level: 'intermedio',
      steps: [
        {
          order: 1,
          title: 'Trote con cambios de dirección',
          duration: '4 min',
          description: 'Trote progresivo con giros controlados a ambos lados.'
        },
        {
          order: 2,
          title: 'Ejercicios de fuerza isométrica',
          duration: '3 min',
          description: 'Sentadillas isométricas y plancha frontal.'
        },
        {
          order: 3,
          title: 'Saltos suaves',
          duration: '3 min',
          description: 'Saltos cortos con enfoque en amortiguación y alineación de rodillas.'
        }
      ]
    },
    {
      id: 'r3',
      name: 'Recuperación activa post-partido (8 min)',
      type: 'recuperacion',
      totalTime: '8 min',
      focusZone: 'Piernas',
      level: 'básico',
      steps: [
        {
          order: 1,
          title: 'Caminata suave',
          duration: '3 min',
          description: 'Caminata tranquila para bajar pulsaciones.'
        },
        {
          order: 2,
          title: 'Estiramientos estáticos',
          duration: '5 min',
          description: 'Enfocados en cuádriceps, isquiotibiales y pantorrillas.'
        }
      ]
    }
  ];

  // aquí obtengo la rutina seleccionada para mostrar sus pasos
  get selectedRoutine(): WarmupRoutine | null {
    return this.routines.find(r => r.id === this.selectedRoutineId) ?? null;
  }

  // aquí marco qué rutina estoy consultando
  selectRoutine(id: string) {
    this.selectedRoutineId = id;
  }

  // aquí regreso una etiqueta legible para el tipo de rutina
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
