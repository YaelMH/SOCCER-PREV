// src/app/features/history/history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../auth/auth.service';

type RiskLevel = 'bajo' | 'medio' | 'alto';

interface RecommendationHistoryItem {
  id: number | string;
  date: string;
  fechaTexto: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  gravedadRaw: string;
  source: string;
  recomendaciones: string[];
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
  id?: number | string;
  date: string;
  zone: string;
  type: string;
  description: string;
  severity: 'Leve' | 'Moderada' | 'Grave';
  recoveryTime: string;
  origin?: string;
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

  // Recomendaciones desde backend Node
  recommendations: RecommendationHistoryItem[] = [];
  filteredRecommendations: RecommendationHistoryItem[] = [];

  // Lesiones: ahora vendrán de Firestore (users/{uid}.injuries)
  injuries: InjuryHistoryItem[] = [];

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
    this.authService.authChanges().subscribe((user) => {
      if (!user) {
        this.recommendations = [];
        this.filteredRecommendations = [];
        this.injuries = [];
        return;
      }

      const usuarioId = user.uid;

      // 1) Cargar historial de recomendaciones desde el backend
      this.cargarHistorial(usuarioId);

      // 2) Suscribirnos al perfil en Firestore para leer las lesiones
      this.authService.getUserProfile(usuarioId).subscribe((data) => {
        const rawInjuries: any[] = Array.isArray(data?.injuries)
          ? data.injuries
          : [];

        this.injuries = rawInjuries.map((inj) => {
          const gravedad = (inj.severity || 'Moderada') as
            | 'Leve'
            | 'Moderada'
            | 'Grave';

          return {
            id: inj.id ?? Date.now(),
            date: inj.date ?? '',
            zone: inj.zone ?? 'Zona no especificada',
            type: inj.type ?? 'Lesión',
            description:
              inj.description ||
              'Lesión registrada automáticamente a partir de una recomendación.',
            severity: gravedad,
            recoveryTime: inj.recoveryTime ?? 'Por definir según evolución',
            origin: inj.origin ?? 'manual'
          } as InjuryHistoryItem;
        });
      });
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

  // ===== ESTILOS LESIONES =====

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
