import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecommendationService } from '../../../services/recommendation.service';
import { AuthService } from '../../../auth/auth.service';
import { User } from '@angular/fire/auth';

type RiskLevel = 'bajo' | 'medio' | 'alto';

interface HistorialItem {
  id: number;
  fecha: string;
  tipo_lesion: string;
  gravedad: 'Baja' | 'Media' | 'Alta';
  descripcion: string;
  fuente: string;
  riesgo: RiskLevel;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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

  riesgoActualNivel: RiskLevel = 'bajo';
  riesgoActualTexto = 'Bajo';

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
          return;
        }

        // Mapeo del formato del backend al modelo del dashboard
        this.historial = items.map((it) => this.mapearItemHistorial(it));

        // Tomamos la más reciente (la API ya debería venir ordenada desc)
        this.ultimaRecomendacion = this.historial[0];
        this.actualizarRiesgoActual();
      },
      error: (err) => {
        console.error('Error al cargar historial del dashboard:', err);
        this.cargando = false;
        this.error = 'Ocurrió un error al cargar tus recomendaciones.';
        this.historial = [];
        this.ultimaRecomendacion = null;
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

    return {
      id: apiItem.id ?? 0,
      fecha: apiItem.fecha ?? apiItem.fechaISO ?? '',
      tipo_lesion: apiItem.tipo_lesion ?? 'Recomendación',
      gravedad: gravedadApi,
      descripcion: apiItem.descripcion ?? '',
      fuente: apiItem.fuente ?? 'Condición diaria + modelo',
      riesgo
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
}