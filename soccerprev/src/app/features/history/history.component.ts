import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../auth/auth.service';

type RiskLevel = 'bajo' | 'medio' | 'alto';

interface RecommendationHistoryItem {
  // identificador para el modal / tracking
  id: number | string;

  // fechas
  date: string;        // normalmente fechaISO
  fechaTexto: string;  // fecha legible (local)

  // datos principales
  type: string;        // tipo_lesion
  description: string; // descripcion
  riskLevel: RiskLevel;
  gravedadRaw: string; // "Baja" | "Media" | "Alta" (texto original backend)
  source: string;      // fuente

  // info extra de la recomendación
  recomendaciones: string[]; // array de strings
  dolor?: {
    nivel: number;
    dias: number;
    zona: string;
  } | null;
  especialista?: {
    necesario: boolean;
    urgente: boolean;
    motivo: string;
  } | null;
  aviso?: string;
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

  // Lesiones mock (por ahora)
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

  // estado del modal de detalle
  showDetailModal = false;
  selectedRecommendation: RecommendationHistoryItem | null = null;

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
        this.recommendations = items.map((item: any): RecommendationHistoryItem => {
          const riskLevel = this.gravedadToRiskLevel(item.gravedad);

          return {
            id: item.id ?? item.fechaISO ?? item.fecha ?? Date.now().toString(),
            date: item.fechaISO ?? item.fecha ?? '',
            fechaTexto: item.fecha ?? item.fechaISO ?? '',
            type: item.tipo_lesion ?? 'Recomendación',
            description: item.descripcion ?? '',
            riskLevel,
            gravedadRaw: item.gravedad ?? '',
            source: item.fuente ?? 'Condición diaria + modelo',
            recomendaciones: Array.isArray(item.recomendaciones)
              ? item.recomendaciones
              : [],
            dolor: item.dolor ?? null,
            especialista: item.especialista ?? null,
            aviso: item.aviso ?? '',
          };
        });

        this.filteredRecommendations = [...this.recommendations];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error cargando historial:', err);
        this.error = 'No se pudo cargar el historial de recomendaciones.';
        this.loading = false;
      },
    });
  }

  // ===== FILTRO DE RIESGO =====

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

  // ===== MODAL DETALLE =====

  openDetail(rec: RecommendationHistoryItem) {
    this.selectedRecommendation = rec;
    this.showDetailModal = true;
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selectedRecommendation = null;
  }

  // ===== ESTILOS RECOMENDACIÓN =====

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

  // ===== ESTILOS LESIONES MOCK =====

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