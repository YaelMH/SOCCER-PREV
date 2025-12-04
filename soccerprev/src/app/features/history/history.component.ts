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
  aviso?: string;
}

interface InjuryHistoryItem {
  id: string; // 👈 identificador interno para poder eliminar
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

  // usuario actual (uid de Firebase, necesario para eliminar)
  private currentUserId: string | null = null;

  // Datos que vienen del backend
  recommendations: RecommendationHistoryItem[] = [];
  filteredRecommendations: RecommendationHistoryItem[] = [];

  // 🔹 Mock por defecto, por si aún no hay lesiones guardadas en el backend
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

  // Lesiones (ahora se intentan cargar del backend y, si no hay, quedan estos mocks)
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

  // estado de eliminación
  isDeletingRecommendationId: string | number | null = null;
  isDeletingInjuryId: string | null = null;

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Me suscribo al usuario actual de Firebase
    this.authService.authChanges().subscribe((user) => {
      if (!user) {
        // si no hay sesión, dejo vacío
        this.currentUserId = null;
        this.recommendations = [];
        this.filteredRecommendations = [];
        this.injuries = [...this.defaultMockInjuries];
        return;
      }

      const usuarioId = user.uid;
      this.currentUserId = usuarioId;

      this.cargarHistorial(usuarioId);
      this.cargarLesionesPrevias(usuarioId);
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

  // ============================
  //   LESIONES / EVENTOS PERFIL
  // ============================

  private cargarLesionesPrevias(usuarioId: string) {
    this.loadingInjuries = true;
    this.errorInjuries = '';

    this.recommendationService.obtenerPerfilLesiones(usuarioId).subscribe({
      next: (resp: any) => {
        this.loadingInjuries = false;

        // El endpoint devuelve un único objeto o un array
        const perfil = Array.isArray(resp) ? resp[0] : resp;
        if (!perfil || !Array.isArray(perfil.injuries) || !perfil.injuries.length) {
          // Si no hay lesiones guardadas todavía, dejamos las mock
          this.injuries = [...this.defaultMockInjuries];
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
        this.injuries = [...this.defaultMockInjuries];
      },
    });
  }

  private mapPerfilInjuries(rawInjuries: any[]): InjuryHistoryItem[] {
    return rawInjuries.map((inj, index): InjuryHistoryItem => {
      // Normalizamos gravedad a algo de nuestro enum
      const sevRaw = String(inj.severity || '').toLowerCase();
      let severity: InjuryHistoryItem['severity'] = 'Leve';
      if (sevRaw === 'moderada') severity = 'Moderada';
      else if (sevRaw === 'grave') severity = 'Grave';

      const idCandidate =
        inj.id ||
        inj._id ||
        `${inj.date || ''}-${inj.zone || ''}-${index}`;

      return {
        id: String(idCandidate),
        date: inj.date || '',
        zone: inj.zone || '',
        type: inj.type || 'Lesión previa',
        description: inj.description || '',
        severity,
        recoveryTime: inj.recoveryTime || '—',
      };
    });
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

  // ============================
  //     ELIMINAR REGISTROS
  // ============================

  confirmDeleteRecommendation(rec: RecommendationHistoryItem) {
    if (!this.currentUserId) {
      alert('Debes iniciar sesión para eliminar una recomendación.');
      return;
    }

    const ok = window.confirm(
      '¿Seguro que quieres eliminar esta recomendación del historial?'
    );
    if (!ok) return;

    this.isDeletingRecommendationId = rec.id;

    this.recommendationService
      .eliminarRecomendacion(this.currentUserId, rec.id)
      .subscribe({
        next: () => {
          // quitamos de las listas locales
          this.recommendations = this.recommendations.filter(
            (r) => r.id !== rec.id
          );
          this.filteredRecommendations = this.filteredRecommendations.filter(
            (r) => r.id !== rec.id
          );
          this.isDeletingRecommendationId = null;
        },
        error: (err) => {
          console.error('Error eliminando recomendación:', err);
          alert('No se pudo eliminar la recomendación. Intenta de nuevo.');
          this.isDeletingRecommendationId = null;
        },
      });
  }

  confirmDeleteInjury(injury: InjuryHistoryItem) {
    // Si es mock, solo la quitamos localmente (no pegamos al backend)
    if (injury.id.startsWith('mock-')) {
      const ok = window.confirm(
        'Esta es una lesión de ejemplo. ¿Quieres ocultarla de la lista?'
      );
      if (!ok) return;

      this.injuries = this.injuries.filter((i) => i.id !== injury.id);
      return;
    }

    if (!this.currentUserId) {
      alert('Debes iniciar sesión para eliminar una lesión de tu perfil.');
      return;
    }

    const ok = window.confirm(
      '¿Seguro que quieres eliminar esta lesión de tu perfil?'
    );
    if (!ok) return;

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
          alert('No se pudo eliminar la lesión. Intenta de nuevo.');
          this.isDeletingInjuryId = null;
        },
      });
  }
}