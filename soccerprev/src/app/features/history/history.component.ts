import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type RiskLevel = 'bajo' | 'medio' | 'alto';

interface RecommendationHistoryItem {
  date: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  source: string; // aquí guardo de dónde salió la recomendación (condición, IA, etc.)
}

interface InjuryHistoryItem {
  date: string;
  zone: string;
  type: string;
  description: string;
  severity: 'Leve' | 'Moderada' | 'Grave';
  recoveryTime: string; // aquí luego puedo guardar días exactos desde backend
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent {
  // aquí controlo qué tab estoy mostrando
  activeTab: 'recomendaciones' | 'lesiones' = 'recomendaciones';

  // aquí simulo las recomendaciones históricas (después las voy a traer del backend)
  recommendations: RecommendationHistoryItem[] = [
    {
      date: '2025-11-18',
      type: 'Carga de entrenamiento',
      description: 'Reducir intensidad en ejercicios de sprint durante 2 sesiones.',
      riskLevel: 'medio',
      source: 'Condición diaria + historial de carga'
    },
    {
      date: '2025-11-17',
      type: 'Recuperación',
      description: 'Añadir estiramientos suaves por 15 minutos antes de dormir.',
      riskLevel: 'bajo',
      source: 'Condición diaria'
    },
    {
      date: '2025-11-10',
      type: 'Prevención específica',
      description: 'Evitar cambios bruscos de dirección en superficies irregulares 48 horas.',
      riskLevel: 'alto',
      source: 'Evento previo de molestia en rodilla'
    }
  ];

  // aquí guardo el arreglo filtrado según el nivel de riesgo
  filteredRecommendations: RecommendationHistoryItem[] = [...this.recommendations];

  // aquí simulo mi historial de lesiones / eventos
  injuries: InjuryHistoryItem[] = [
    {
      date: '2024-08-15',
      zone: 'Rodilla derecha',
      type: 'Sobrecarga',
      description: 'Molestia posterior a sesiones de alta intensidad sin descanso suficiente.',
      severity: 'Moderada',
      recoveryTime: '3 semanas aprox.'
    },
    {
      date: '2023-03-02',
      zone: 'Tobillo izquierdo',
      type: 'Esguince',
      description: 'Lesión durante un partido en superficie irregular.',
      severity: 'Grave',
      recoveryTime: '2 meses aprox.'
    }
  ];

  // aquí aplico el filtro por nivel de riesgo
  filterRisk(level: RiskLevel | 'todos') {
    if (level === 'todos') {
      // aquí dejo visible todo el historial
      this.filteredRecommendations = [...this.recommendations];
      return;
    }

    this.filteredRecommendations = this.recommendations.filter(
      (rec) => rec.riskLevel === level
    );
  }

  // aquí regreso clases para la "pastilla" según el nivel de riesgo
  getRiskPillClasses(risk: RiskLevel): string {
    switch (risk) {
      case 'bajo':
        return 'bg-accent/10 text-accent';
      case 'medio':
        return 'bg-warning/10 text-warning';
      case 'alto':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-app-border text-text-muted';
    }
  }

  // aquí regreso clases para el puntito de color según el nivel de riesgo
  getRiskDotClasses(risk: RiskLevel): string {
    switch (risk) {
      case 'bajo':
        return 'bg-accent';
      case 'medio':
        return 'bg-warning';
      case 'alto':
        return 'bg-danger';
      default:
        return 'bg-app-border';
    }
  }

  // aquí doy estilos según la gravedad de la lesión
  getSeverityPillClasses(severity: InjuryHistoryItem['severity']): string {
    switch (severity) {
      case 'Leve':
        return 'bg-accent/10 text-accent';
      case 'Moderada':
        return 'bg-warning/10 text-warning';
      case 'Grave':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-app-border text-text-muted';
    }
  }

  // aquí pinto el puntito de color según la gravedad
  getSeverityDotClasses(severity: InjuryHistoryItem['severity']): string {
    switch (severity) {
      case 'Leve':
        return 'bg-accent';
      case 'Moderada':
        return 'bg-warning';
      case 'Grave':
        return 'bg-danger';
      default:
        return 'bg-app-border';
    }
  }
}
