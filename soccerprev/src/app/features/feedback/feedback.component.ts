import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../auth/auth.service';

type RiskLevel = 'bajo' | 'medio' | 'alto';

interface FeedbackRecommendationItem {
  id: number;
  fechaISO: string;
  fechaTexto: string;
  tipo: string;
  descripcion: string;
  gravedad: string;
  riskLevel: RiskLevel;
  fuente: string;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit {
  // últimas recomendaciones del usuario
  recommendations: FeedbackRecommendationItem[] = [];
  selectedRecommendation: FeedbackRecommendationItem | null = null;

  loading = false;
  error = '';
  submitMessage = '';

  // datos del usuario logueado
  private usuarioId: string | null = null;

  // formulario de feedback
  applied: 'si' | 'no' | '' = '';
  helpfulScore = 5;   // 1–10
  clarityScore = 5;   // 1–10
  stars = 4;          // 1–5
  comment = '';

  starsArray = [1, 2, 3, 4, 5];

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.authChanges().subscribe(user => {
      if (!user) {
        this.usuarioId = null;
        this.recommendations = [];
        this.selectedRecommendation = null;
        return;
      }

      this.usuarioId = user.uid;
      this.cargarUltimasRecomendaciones(user.uid);
    });
  }

  private cargarUltimasRecomendaciones(usuarioId: string) {
    this.loading = true;
    this.error = '';
    this.submitMessage = '';

    // Pedimos las últimas 5 recomendaciones
    this.recommendationService.obtenerHistorial(usuarioId, 5).subscribe({
      next: (items: any[]) => {
        this.recommendations = items.map((item: any) => ({
          id: item.id ?? 0,
          fechaISO: item.fechaISO ?? '',
          fechaTexto: item.fecha ?? item.fechaISO ?? '',
          tipo: item.tipo_lesion ?? 'Recomendación',
          descripcion: item.descripcion ?? '',
          gravedad: item.gravedad ?? 'Baja',
          riskLevel:
            (item.gravedad || '').toLowerCase() === 'alta'
              ? 'alto'
              : (item.gravedad || '').toLowerCase() === 'media'
              ? 'medio'
              : 'bajo',
          fuente: item.fuente ?? 'Condición diaria + modelo'
        }));

        // preselecciono la más reciente
        this.selectedRecommendation = this.recommendations[0] ?? null;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error cargando últimas recomendaciones para feedback:', err);
        this.error = 'No se pudieron cargar tus últimas recomendaciones.';
        this.loading = false;
      }
    });
  }

  // cuando el usuario selecciona una recomendación de la lista
  selectRecommendation(rec: FeedbackRecommendationItem) {
    this.selectedRecommendation = rec;
    this.submitMessage = '';
  }

  // cambiar estrellas
  setStars(value: number) {
    this.stars = value;
  }

  // enviar feedback
  submitFeedback() {
    this.submitMessage = '';

    if (!this.usuarioId || !this.selectedRecommendation) {
      this.error = 'Debes seleccionar una recomendación y tener sesión iniciada.';
      return;
    }

    if (!this.applied) {
      this.error = 'Indica si aplicaste o no la recomendación.';
      return;
    }

    // 👇 Ahora coincide con RecommendationFeedbackPayload
    const payload = {
      usuario_id: this.usuarioId,
      recomendacion_id: this.selectedRecommendation.id,
      aplicada: this.applied === 'si',        // boolean
      util_prevenir: this.helpfulScore,       // 1–10
      claridad: this.clarityScore,           // 1–10
      estrellas: this.stars,                 // 1–5
      comentario: this.comment
    };

    this.loading = true;
    this.error = '';

    this.recommendationService.enviarFeedback(payload).subscribe({
      next: () => {
        this.loading = false;
        this.submitMessage =
          '¡Gracias por tu feedback! Nos ayuda a mejorar las recomendaciones.';

        // reset parcial del formulario
        this.applied = '';
        this.helpfulScore = 5;
        this.clarityScore = 5;
        this.stars = 4;
        this.comment = '';
      },
      error: (err: any) => {
        console.error('Error enviando feedback:', err);
        this.loading = false;
        this.error =
          'Ocurrió un problema al guardar tu feedback. Intenta más tarde.';
      }
    });
  }

  // helpers de estilos para el pill de riesgo
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