import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  estado_fisico?: EstadoFisico | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  // Riesgo actual (pill verde/amarillo/rojo)
  riesgoActualNivel: RiskLevel = 'bajo';
  riesgoActualTexto = 'Bajo';

  // ====== Estado físico / índice de carga semanal ======
  // estado que viene de las recomendaciones (backend)
  estadoFisicoActual: EstadoFisico | null = null;
  // 🔹 nuevo: estado físico calculado a partir del perfil (Resumen deportivo)
  estadoFisicoPerfil: EstadoFisico | null = null;

  tendenciaTexto = 'Sin datos';
  tendenciaColorClass = 'text-text-muted';

  // ====== ALERTA DE CAMBIO DE RIESGO ======
  riskAlertMessage: string | null = null;
  riskAlertType: 'up' | 'down' | 'first' | 'none' = 'none';

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.authChanges().subscribe(user => {
      this.user = user;

      // 🔴 IMPORTANTE: usar la misma lógica que en ConditionComponent
      const usuarioId = user ? (user.uid || user.email || null) : null;
      this.usuarioId = usuarioId;

      if (this.usuarioId) {
        // Historial de recomendaciones (riesgo, tendencia, etc.)
        this.cargarHistorial(this.usuarioId);
        // 🔹 nuevo: estado físico basado en el perfil (partidos, entrenos, lesiones)
        this.cargarEstadoFisicoDesdePerfil(this.usuarioId);
      } else {
        this.historial = [];
        this.ultimaRecomendacion = null;
        this.riesgoActualTexto = 'Sin registros';
        this.riesgoActualNivel = 'bajo';
        this.estadoFisicoActual = null;
        this.estadoFisicoPerfil = null;
        this.tendenciaTexto = 'Sin datos';
        this.tendenciaColorClass = 'text-text-muted';
        this.riskAlertMessage = null;
        this.riskAlertType = 'none';
      }
    });
  }


  //   HISTORIAL RECOMENDACIONES

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
          this.riskAlertMessage = null;
          this.riskAlertType = 'none';
          return;
        }

        // Mapeo del formato del backend al modelo del dashboard
        this.historial = items.map((it) => this.mapearItemHistorial(it));

        // Tomamos la más reciente (la API ya viene ordenada desc)
        this.ultimaRecomendacion = this.historial[0];

        // Actualizamos riesgo + alerta y estado físico
        this.actualizarRiesgoActualYAlertas();
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
        this.riskAlertMessage = null;
        this.riskAlertType = 'none';
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

    let estado_fisico: EstadoFisico | null = null;

    if (apiItem.estado_fisico) {
      estado_fisico = {
        indice: Number(apiItem.estado_fisico.indice) || 0,
        categoria: (apiItem.estado_fisico.categoria || 'baja') as EstadoCategoria,
        recomendacion: String(apiItem.estado_fisico.recomendacion || '')
      };
    } else {
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

  // 🔥 Detección de cambio de riesgo
  private actualizarRiesgoActualYAlertas(): void {
    if (!this.ultimaRecomendacion) {
      this.riesgoActualNivel = 'bajo';
      this.riesgoActualTexto = 'Sin registros';
      this.riskAlertMessage = null;
      this.riskAlertType = 'none';
      return;
    }

    const actual = this.ultimaRecomendacion.riesgo;
    const previo = this.historial.length > 1 ? this.historial[1].riesgo : null;

    this.riesgoActualNivel = actual;
    this.riesgoActualTexto =
      actual === 'alto' ? 'Alto' : actual === 'medio' ? 'Medio' : 'Bajo';

    if (!previo) {
      this.riskAlertMessage = `Se ha calculado tu primer nivel de riesgo: ${this.riesgoActualTexto}.`;
      this.riskAlertType = 'first';
      return;
    }

    if (previo === actual) {
      this.riskAlertMessage = null;
      this.riskAlertType = 'none';
      return;
    }

    const nivelToNum = (r: RiskLevel) => (r === 'bajo' ? 1 : r === 'medio' ? 2 : 3);
    const diff = nivelToNum(actual) - nivelToNum(previo);

    if (diff > 0) {
      this.riskAlertMessage = `⚠️ Tu riesgo de lesión ha aumentado de ${previo.toUpperCase()} a ${actual.toUpperCase()}. Revisa tus recomendaciones y considera ajustar la carga.`;
      this.riskAlertType = 'up';
    } else {
      this.riskAlertMessage = `✅ Tu riesgo de lesión ha disminuido de ${previo.toUpperCase()} a ${actual.toUpperCase()}. Mantén tus hábitos de prevención.`;
      this.riskAlertType = 'down';
    }
  }

  /** Calcula estado físico actual + tendencia respecto al registro anterior (basado en historial). */
  private actualizarEstadoFisico(): void {
    if (!this.ultimaRecomendacion || !this.ultimaRecomendacion.estado_fisico) {
      this.estadoFisicoActual = null;
      this.tendenciaTexto = 'Sin datos';
      this.tendenciaColorClass = 'text-text-muted';
      return;
    }

    this.estadoFisicoActual = this.ultimaRecomendacion.estado_fisico;

    if (this.historial.length < 2 || !this.historial[1].estado_fisico) {
      this.tendenciaTexto = 'Estable';
      this.tendenciaColorClass = 'text-text-muted';
      return;
    }

    const actual = this.ultimaRecomendacion.estado_fisico.indice;
    const previo = this.historial[1].estado_fisico!.indice;
    const diff = actual - previo;

    if (diff >= 5) {
      this.tendenciaTexto = 'Aumento de carga';
      this.tendenciaColorClass = 'text-warning';
    } else if (diff <= -5) {
      this.tendenciaTexto = 'Ligera reducción';
      this.tendenciaColorClass = 'text-accent';
    } else {
      this.tendenciaTexto = 'Carga estable';
      this.tendenciaColorClass = 'text-text-muted';
    }
  }


  //   ESTADO FÍSICO DESDE PERFIL

  /** Carga el perfil de Firestore y calcula el estado físico a partir de él. */
  private cargarEstadoFisicoDesdePerfil(uid: string): void {
    this.authService.getUserProfile(uid).subscribe({
      next: (profile) => {
        if (!profile) {
          this.estadoFisicoPerfil = null;
          return;
        }
        this.estadoFisicoPerfil = this.calcularEstadoFisicoDesdePerfil(profile);
      },
      error: (err) => {
        console.error('Error cargando perfil para estado físico:', err);
        this.estadoFisicoPerfil = null;
      }
    });
  }

  /** Usa los datos del perfil (partidos, entrenos, lesiones) para estimar el índice. */
  private calcularEstadoFisicoDesdePerfil(profile: any): EstadoFisico {
    // Datos de perfil que ya tienes en "Resumen deportivo"
    const partidos = Number(profile.matchesPerWeek) || 0;      // Partidos por semana
    const entrenos = Number(profile.trainingsPerWeek) || 0;    // Entrenamientos por semana
    const lesiones = Array.isArray(profile.injuries)
      ? profile.injuries.length
      : 0;

    // Sesiones totales por semana
    const sesiones = partidos + entrenos;

    // Suposición: 60 min por sesión (si luego tienes duración real, lo cambiamos)
    const minutosPorSesion = 60;
    let cargaMin = sesiones * minutosPorSesion;

    // Referencia: 8 horas/semana ≈ 480 min ⇒ índice 100
    const referenciaMin = 480;
    let indice = (cargaMin / referenciaMin) * 100;

    // Penalización por historial de lesiones
    if (lesiones >= 2) {
      indice -= 10;
    }

    if (!Number.isFinite(indice)) indice = 0;
    if (indice < 0) indice = 0;
    if (indice > 100) indice = 100;

    indice = Math.round(indice);

    let categoria: EstadoCategoria;
    let recomendacion: string;

    if (indice < 50) {
      categoria = 'baja';
      recomendacion =
        'Tu carga semanal parece baja o tu recuperación no es óptima. Aumenta volumen e intensidad de forma progresiva y cuida sueño y calentamiento.';
    } else if (indice < 75) {
      categoria = 'moderada';
      recomendacion =
        'Tu carga semanal es moderada. Mantén la progresión gradual, respeta los días de descanso y escucha signos tempranos de fatiga.';
    } else {
      categoria = 'alta';
      recomendacion =
        'Tu carga semanal es alta. Vigila molestias persistentes, ajusta la intensidad si notas sobrecarga y refuerza la recuperación (sueño, hidratación, estiramientos).';
    }

    return { indice, categoria, recomendacion };
  }


  //  Helpers de estilos pills

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

  //  Cuidados y resumen última sesión

  get cuidadosProximaSesion(): string[] {
    if (!this.ultimaRecomendacion || !this.ultimaRecomendacion.recomendaciones?.length) {
      return [
        'Hidratarse adecuadamente antes, durante y después del entrenamiento.',
        'Realizar calentamiento dinámico de 10–15 minutos antes de iniciar.',
        'Detener el esfuerzo si el dolor aumenta o aparece inflamación.'
      ];
    }
    return this.ultimaRecomendacion.recomendaciones.slice(0, 3);
  }

  get resumenUltimaLesion(): string | null {
    if (!this.ultimaRecomendacion) return null;
    return `Última lesión: ${this.ultimaRecomendacion.tipo_lesion} (riesgo ${this.ultimaRecomendacion.gravedad.toLowerCase()}).`;
  }

  //  Getters para el card "Estado físico"
  /** Índice que se muestra: primero el del perfil, si no hay, el de la última recomendación. */
  get indiceCargaSemanal(): number | null {
    const fuente = this.estadoFisicoPerfil || this.estadoFisicoActual;
    return fuente ? fuente.indice : null;
  }

  /** Texto "Baja / Moderada / Alta" para el estado general. */
  get categoriaEstadoTexto(): string {
    const fuente = this.estadoFisicoPerfil || this.estadoFisicoActual;
    if (!fuente) return 'Sin datos';

    const c = fuente.categoria;
    if (c === 'alta') return 'Alta';
    if (c === 'moderada') return 'Moderada';
    return 'Baja';
  }

  /** Texto descriptivo del estado físico. */
  get recomendacionEstadoFisico(): string {
    const fuente = this.estadoFisicoPerfil || this.estadoFisicoActual;
    return fuente?.recomendacion ?? '';
  }
}