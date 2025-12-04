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
<<<<<<< HEAD
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
=======
  gravedadRaw: string; // "Baja" | "Media" | "Alta" (texto original backend)
  source: string;      // fuente

  // info extra de la recomendación
  recomendaciones: string[]; // array de strings
  dolor?:
    | {
        nivel: number;
        dias: number;
        zona: string;
      }
    | null;
  especialista?:
    | {
        necesario: boolean;
        urgente: boolean;
        motivo: string;
      }
    | null;
>>>>>>> 01f4183 (Eliminar recomendación e historial de lesiones)
  aviso?: string;
}

interface InjuryHistoryItem {
<<<<<<< HEAD
  id?: number | string;
=======
  // id opcional para poder eliminar desde UI/backend
  id?: string | number;
>>>>>>> 01f4183 (Eliminar recomendación e historial de lesiones)
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

<<<<<<< HEAD
  // Lesiones: ahora vendrán de Firestore (users/{uid}.injuries)
  injuries: InjuryHistoryItem[] = [];
=======
  // Mock por defecto, por si aún no hay lesiones guardadas en el backend
  private readonly defaultMockInjuries: InjuryHistoryItem[] = [
    {
      id: 'mock-1',
      date: '2024-08-15',
      zone: 'Rodilla derecha',
      type: 'Sobrecarga',
      description:
        'Molestia posterior a sesiones de alta intensidad sin descanso suficiente.',
      severity: 'Moderada',
      recoveryTime: '3 semanas aprox.',
    },
    {
      id: 'mock-2',
      date: '2023-03-02',
      zone: 'Tobillo izquierdo',
      type: 'Esguince',
      description: 'Lesión durante un partido en superficie irregular.',
      severity: 'Grave',
      recoveryTime: '2 meses aprox.',
    },
  ];
>>>>>>> 01f4183 (Eliminar recomendación e historial de lesiones)

  // Lesiones (se intentan cargar del backend y, si no hay, quedan estos mocks)
  injuries: InjuryHistoryItem[] = [...this.defaultMockInjuries];

  // estado de carga / error (recomendaciones)
  loading = false;
  error = '';

  // estado de carga / error (lesiones perfil)
  loadingInjuries = false;
  errorInjuries = '';

  // estado del modal de detalle
  showDetailModal = false;
  selectedRecommendation: RecommendationHistoryItem | null = null;

  // usuario actual
  currentUserId: string | null = null;

  // flags para deshabilitar botones mientras borra
  isDeletingRecommendationId: string | number | null = null;
  isDeletingInjuryId: string | number | null = null;

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.authChanges().subscribe((user) => {
      if (!user) {
<<<<<<< HEAD
        this.recommendations = [];
        this.filteredRecommendations = [];
        this.injuries = [];
=======
        this.currentUserId = null;
        this.recommendations = [];
        this.filteredRecommendations = [];
        this.injuries = [...this.defaultMockInjuries];
>>>>>>> 01f4183 (Eliminar recomendación e historial de lesiones)
        return;
      }

      const usuarioId = user.uid;
<<<<<<< HEAD

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
=======
      this.currentUserId = usuarioId;

      this.cargarHistorial(usuarioId);
      this.cargarLesionesPrevias(usuarioId);
>>>>>>> 01f4183 (Eliminar recomendación e historial de lesiones)
    });
  }

  // ============================
  //      HISTORIAL MODELO
  // ============================

  private cargarHistorial(usuarioId: string) {
    this.loading = true;
    this.error = '';

    this.recommendationService.obtenerHistorial(usuarioId, 20).subscribe({
      next: (items: any[]) => {
        this.recommendations = items.map(
          (item: any): RecommendationHistoryItem => {
            const riskLevel = this.gravedadToRiskLevel(item.gravedad);

            return {
              id:
                item.id ??
                item._id ??
                item.fechaISO ??
                item.fecha ??
                Date.now().toString(),
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
          }
        );

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

  // ===== ELIMINAR RECOMENDACIÓN (HISTORIAL) =====

  confirmDeleteRecommendation(rec: RecommendationHistoryItem) {
    if (!this.currentUserId) return;

    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta recomendación del historial? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    this.isDeletingRecommendationId = rec.id;

    this.recommendationService
      .eliminarRecomendacion(this.currentUserId, rec.id)
      .subscribe({
        next: () => {
          this.recommendations = this.recommendations.filter(
            (r) => r.id !== rec.id
          );
          this.filteredRecommendations = this.filteredRecommendations.filter(
            (r) => r.id !== rec.id
          );

          if (
            this.selectedRecommendation &&
            this.selectedRecommendation.id === rec.id
          ) {
            this.closeDetail();
          }

          this.isDeletingRecommendationId = null;
        },
        error: (err) => {
          console.error('Error eliminando recomendación:', err);
          alert(
            'Ocurrió un error al eliminar la recomendación. Intenta de nuevo más tarde.'
          );
          this.isDeletingRecommendationId = null;
        },
      });
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

<<<<<<< HEAD
=======
  // ============================
  //   LESIONES / EVENTOS PERFIL
  // ============================

  private cargarLesionesPrevias(usuarioId: string) {
    this.loadingInjuries = true;
    this.errorInjuries = '';

    this.recommendationService.obtenerPerfilLesiones(usuarioId).subscribe({
      next: (resp: any) => {
        this.loadingInjuries = false;

        const perfil = Array.isArray(resp) ? resp[0] : resp;
        if (!perfil || !Array.isArray(perfil.injuries) || !perfil.injuries.length) {
          // Si no hay lesiones guardadas todavía, dejamos las mock
          return;
        }

        this.injuries = this.mapPerfilInjuries(perfil.injuries);
      },
      error: (err) => {
        console.error('Error cargando perfil de lesiones:', err);
        this.loadingInjuries = false;
        this.errorInjuries =
          'No se pudo cargar el historial de lesiones previas desde tu perfil.';
        // En error también dejamos las mock
      },
    });
  }

  private mapPerfilInjuries(rawInjuries: any[]): InjuryHistoryItem[] {
    return rawInjuries.map((inj) => {
      const sevRaw = String(inj.severity || '').toLowerCase();
      let severity: InjuryHistoryItem['severity'] = 'Leve';
      if (sevRaw === 'moderada') severity = 'Moderada';
      else if (sevRaw === 'grave') severity = 'Grave';

      return {
        id: inj.id || inj._id || `${inj.date || ''}-${inj.zone || ''}`,
        date: inj.date || '',
        zone: inj.zone || '',
        type: inj.type || 'Lesión previa',
        description: inj.description || '',
        severity,
        recoveryTime: inj.recoveryTime || '—',
      };
    });
  }

  // ===== ELIMINAR LESIÓN / EVENTO DEL PERFIL =====

  confirmDeleteInjury(injury: InjuryHistoryItem) {
    if (!this.currentUserId) return;

    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta lesión/evento de tu historial?'
    );

    if (!confirmed) return;

    // Si es mock (id no real), solo la quitamos localmente
    if (!injury.id || String(injury.id).startsWith('mock-')) {
      this.injuries = this.injuries.filter((i) => i !== injury);
      return;
    }

    this.isDeletingInjuryId = injury.id;

    this.recommendationService
      .eliminarLesion(this.currentUserId, injury.id)
      .subscribe({
        next: () => {
          this.injuries = this.injuries.filter((i) => i.id !== injury.id);
          this.isDeletingInjuryId = null;
        },
        error: (err) => {
          console.error('Error eliminando lesión del perfil:', err);
          alert(
            'Ocurrió un error al eliminar la lesión. Intenta de nuevo más tarde.'
          );
          this.isDeletingInjuryId = null;
        },
      });
  }

>>>>>>> 01f4183 (Eliminar recomendación e historial de lesiones)
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
