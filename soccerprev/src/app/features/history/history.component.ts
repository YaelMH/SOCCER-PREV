import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../auth/auth.service';

type RiskLevel = 'bajo' | 'medio' | 'alto';

interface RecommendationHistoryItem {
  date: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  source: string; // de dónde salió la recomendación (condición, IA, etc.)
}

interface InjuryHistoryItem {
  date: string;
  zone: string;
  type: string;
  description: string;
  severity: 'Leve' | 'Moderada' | 'Grave';
  recoveryTime: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  // Tabs
  activeTab: 'recomendaciones' | 'lesiones' = 'recomendaciones';

  // Datos que vienen del backend
  recommendations: RecommendationHistoryItem[] = [];
  filteredRecommendations: RecommendationHistoryItem[] = [];

  // Por ahora las lesiones siguen mockeadas
  injuries: InjuryHistoryItem[] = [
    {
      date: '2024-08-15',
      zone: 'Rodilla derecha',
      type: 'Sobrecarga',
      description:
        'Molestia posterior a sesiones de alta intensidad sin descanso suficiente.',
      severity: 'Moderada',
      recoveryTime: '3 semanas aprox.',
    },
    {
      date: '2023-03-02',
      zone: 'Tobillo izquierdo',
      type: 'Esguince',
      description: 'Lesión durante un partido en superficie irregular.',
      severity: 'Grave',
      recoveryTime: '2 meses aprox.',
    },
  ];

  // estado de carga / error
  loading = false;
  error = '';

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Me suscribo al usuario actual de Firebase
    this.authService.authChanges().subscribe((user) => {
      if (!user) {
        // si no hay sesión, dejo vacío
        this.recommendations = [];
        this.filteredRecommendations = [];
        return;
      }

      const usuarioId = user.uid;
      this.cargarHistorial(usuarioId);
    });
  }

  private cargarHistorial(usuarioId: string) {
    this.loading = true;
    this.error = '';

      this.recommendationService.obtenerHistorial(usuarioId, 20).subscribe({
      next: (items: any[]) => {
        // aquí transformas items en this.recommendations
        this.recommendations = items.map((item: any) => ({
          date: item.fechaISO ?? item.fecha ?? '',
          type: item.tipo_lesion ?? 'Recomendación',
          description: item.descripcion ?? '',
          // aquí podrías mapear gravedad -> bajo/medio/alto
          riskLevel:
            item.gravedad === 'Alta'
              ? 'alto'
              : item.gravedad === 'Media'
              ? 'medio'
              : 'bajo',
          source: item.fuente ?? 'Condición diaria + modelo'
        }));

        this.filteredRecommendations = [...this.recommendations];
        this.loading = false;
      },
      error: (err: any) => {           // 👈 aquí tipamos err para que no marque ts(7006)
        console.error('Error cargando historial:', err);
        this.error = 'No se pudo cargar el historial de recomendaciones.';
        this.loading = false;
      }
    });
  }

  //      FILTRO DE RIESGO

  filterRisk(level: RiskLevel | 'todos') {
    if (level === 'todos') {
      this.filteredRecommendations = [...this.recommendations];
      return;
    }

    this.filteredRecommendations = this.recommendations.filter(
      (rec) => rec.riskLevel === level
    );
  }

  // Mapea "Baja" | "Media" | "Alta" del backend a 'bajo' | 'medio' | 'alto'
  private gravedadToRiskLevel(gravedad: string | undefined): RiskLevel {
    const g = (gravedad || '').toLowerCase();
    if (g === 'alta') return 'alto';
    if (g === 'media') return 'medio';
    return 'bajo';
  }


  //   ESTILOS DE RECOMENDACIÓN

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

  //   ESTILOS DE LESIONES MOCK

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