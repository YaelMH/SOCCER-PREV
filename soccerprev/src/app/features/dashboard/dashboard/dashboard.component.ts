import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 
import { RecommendationService } from '../../../services/recommendation.service';
import { AuthService } from '../../../auth/auth.service';
import { User } from '@angular/fire/auth';

type RiskLevel = 'bajo' | 'medio' | 'alto';

// Estado físico devuelto por el backend en cada recomendación
type EstadoCategoria = 'baja' | 'moderada' | 'alta';

interface EstadoFisico {
  indice: number;              // 0–100
  categoria: EstadoCategoria;  // baja | moderada | alta
  recomendacion: string;       // texto corto
}

interface HistorialItem {
  id: number;
  fecha: string;
  tipo_lesion: string;
  gravedad: 'Baja' | 'Media' | 'Alta';
  descripcion: string;
  fuente: string;
  riesgo: RiskLevel;
  recomendaciones: string[];
  estado_fisico?: EstadoFisico | null; // NUEVO
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  cargando = false;
  error = '';

  user: User | null = null;
  usuarioId: string | null = null;

  historial: HistorialItem[] = [];
  ultimaRecomendacion: HistorialItem | null = null;

  // Riesgo actual (para el pill verde/amarillo/rojo)
  riesgoActualNivel: RiskLevel = 'bajo';
  riesgoActualTexto = 'Bajo';

  // ====== Estado físico / índice de carga semanal ======
  estadoFisicoActual: EstadoFisico | null = null;
  // texto de tendencia entre la última y la penúltima recomendación
  tendenciaTexto = 'Sin datos';
  // clase que podrás usar en el template para el color (verde/amarillo/rojo/gris)
  tendenciaColorClass = 'text-text-muted';

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Nos suscribimos al usuario logueado
    this.authService.authChanges().subscribe(user => {
      this.user = user;
      this.usuarioId = user?.uid ?? null;

      if (this.usuarioId) {
        this.cargarHistorial(this.usuarioId);
      } else {
        this.historial = [];
        this.ultimaRecomendacion = null;
        this.riesgoActualTexto = 'Sin registros';
        this.riesgoActualNivel = 'bajo';
        this.estadoFisicoActual = null;
        this.tendenciaTexto = 'Sin datos';
        this.tendenciaColorClass = 'text-text-muted';
      }
    });
  }

  private cargarHistorial(usuarioId: string): void {
    this.cargando = true;
    this.error = '';

    // Pedimos solo las últimas 3 recomendaciones
    this.recommendationService.obtenerHistorial(usuarioId, 3).subscribe({
      next: (items: any[]) => {
        this.cargando = false;

        if (!items || items.length === 0) {
          this.historial = [];
          this.ultimaRecomendacion = null;
          this.riesgoActualTexto = 'Sin registros';
          this.riesgoActualNivel = 'bajo';
          this.estadoFisicoActual = null;
          this.tendenciaTexto = 'Sin datos';
          this.tendenciaColorClass = 'text-text-muted';
          return;
        }

        // Mapeo del formato del backend al modelo del dashboard
        this.historial = items.map((it) => this.mapearItemHistorial(it));

        // Tomamos la más reciente (la API ya viene ordenada desc)
        this.ultimaRecomendacion = this.historial[0];

        this.actualizarRiesgoActual();
        this.actualizarEstadoFisico();
      },
      error: (err) => {
        console.error('Error al cargar historial del dashboard:', err);
        this.cargando = false;
        this.error = 'Ocurrió un error al cargar tus recomendaciones.';
        this.historial = [];
        this.ultimaRecomendacion = null;
        this.estadoFisicoActual = null;
        this.tendenciaTexto = 'Sin datos';
        this.tendenciaColorClass = 'text-text-muted';
      }
    });
  }

  private mapearItemHistorial(apiItem: any): HistorialItem {
    const gravedadApi = (apiItem.gravedad ?? 'Baja') as 'Baja' | 'Media' | 'Alta';

    const riesgo: RiskLevel =
      gravedadApi === 'Alta'
        ? 'alto'
        : gravedadApi === 'Media'
        ? 'medio'
        : 'bajo';

    // ---- Estado físico devuelto por el backend (si existe) ----
    let estado_fisico: EstadoFisico | null = null;

    if (apiItem.estado_fisico) {
      // Formato esperado desde Node: { indice, categoria, recomendacion }
      estado_fisico = {
        indice: Number(apiItem.estado_fisico.indice) || 0,
        categoria: (apiItem.estado_fisico.categoria || 'baja') as EstadoCategoria,
        recomendacion: String(apiItem.estado_fisico.recomendacion || '')
      };
    } else {
      // Fallback simple basado en la gravedad, para registros viejos
      const indiceFallback =
        gravedadApi === 'Alta' ? 85 : gravedadApi === 'Media' ? 70 : 55;
      const categoriaFallback: EstadoCategoria =
        gravedadApi === 'Alta'
          ? 'alta'
          : gravedadApi === 'Media'
          ? 'moderada'
          : 'baja';

      estado_fisico = {
        indice: indiceFallback,
        categoria: categoriaFallback,
        recomendacion:
          'Estimación basada en el nivel de riesgo. Mantén una progresión gradual y cuida la recuperación (sueño, hidratación, calentamiento).'
      };
    }

    return {
      id: apiItem.id ?? 0,
      fecha: apiItem.fecha ?? apiItem.fechaISO ?? '',
      tipo_lesion: apiItem.tipo_lesion ?? 'Recomendación',
      gravedad: gravedadApi,
      descripcion: apiItem.descripcion ?? '',
      fuente: apiItem.fuente ?? 'Condición diaria + modelo',
      recomendaciones: apiItem.recomendaciones ?? [],
      riesgo,
      estado_fisico
    };
  }

  private actualizarRiesgoActual(): void {
    if (!this.ultimaRecomendacion) {
      this.riesgoActualNivel = 'bajo';
      this.riesgoActualTexto = 'Sin registros';
      return;
    }

    const r = this.ultimaRecomendacion.riesgo;
    this.riesgoActualNivel = r;
    this.riesgoActualTexto =
      r === 'alto' ? 'Alto' : r === 'medio' ? 'Medio' : 'Bajo';
  }

  /** Calcula estado físico actual + tendencia respecto al registro anterior. */
  private actualizarEstadoFisico(): void {
    if (!this.ultimaRecomendacion || !this.ultimaRecomendacion.estado_fisico) {
      this.estadoFisicoActual = null;
      this.tendenciaTexto = 'Sin datos';
      this.tendenciaColorClass = 'text-text-muted';
      return;
    }

    this.estadoFisicoActual = this.ultimaRecomendacion.estado_fisico;

    // Tendencia (comparando índice con la recomendación inmediatamente anterior)
    if (this.historial.length < 2 || !this.historial[1].estado_fisico) {
      this.tendenciaTexto = 'Estable';
      this.tendenciaColorClass = 'text-text-muted';
      return;
    }

    const actual = this.ultimaRecomendacion.estado_fisico.indice;
    const previo = this.historial[1].estado_fisico!.indice;
    const diff = actual - previo;

    // Umbrales simples para no ser tan sensibles
    if (diff >= 5) {
      this.tendenciaTexto = 'Aumento de carga';
      this.tendenciaColorClass = 'text-warning'; // amarillo
    } else if (diff <= -5) {
      this.tendenciaTexto = 'Ligera reducción';
      this.tendenciaColorClass = 'text-accent'; // verde
    } else {
      this.tendenciaTexto = 'Carga estable';
      this.tendenciaColorClass = 'text-text-muted';
    }
  }

  // =========================
  //  Helpers de estilos pills
  // =========================
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

  // =========================
  //  Cuidados y resumen última sesión
  // =========================
  // Cuidados que se mostrarán en la card "Cuidados para tu última sesión"
  get cuidadosProximaSesion(): string[] {
    // Si no hay última recomendación o no trae recomendaciones, usamos un fallback genérico
    if (!this.ultimaRecomendacion || !this.ultimaRecomendacion.recomendaciones?.length) {
      return [
        'Hidratarse adecuadamente antes, durante y después del entrenamiento.',
        'Realizar calentamiento dinámico de 10–15 minutos antes de iniciar.',
        'Detener el esfuerzo si el dolor aumenta o aparece inflamación.'
      ];
    }

    // Tomamos las primeras 2–3 recomendaciones del modelo
    return this.ultimaRecomendacion.recomendaciones.slice(0, 3);
  }

  get resumenUltimaLesion(): string | null {
    if (!this.ultimaRecomendacion) return null;
    return `Última lesión: ${this.ultimaRecomendacion.tipo_lesion} (riesgo ${this.ultimaRecomendacion.gravedad.toLowerCase()}).`;
  }

  // =========================
  //  Getters para el template del card "Estado físico"
  // =========================
  get indiceCargaSemanal(): number | null {
    return this.estadoFisicoActual ? this.estadoFisicoActual.indice : null;
  }

  get categoriaEstadoTexto(): string {
    if (!this.estadoFisicoActual) return 'Sin datos';
    const c = this.estadoFisicoActual.categoria;
    if (c === 'alta') return 'Alta';
    if (c === 'moderada') return 'Moderada';
    return 'Baja';
  }

  get recomendacionEstadoFisico(): string {
    return this.estadoFisicoActual?.recomendacion ?? '';
  }
}