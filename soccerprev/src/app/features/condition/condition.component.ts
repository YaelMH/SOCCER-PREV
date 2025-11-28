import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../auth/auth.service';  // 👈 ESTA ES LA RUTA

interface ConditionForm {
  usuario_id?: string | null;   // 👈 para ligar historial por usuario

  edad: number | null;
  peso: number | null;
  estatura_m: number | null;
  duracion_partido_min: number | null;
  frecuencia_juego_semana: number | null;
  entrena: number | null;
  calienta: number | null;
  calentamiento_min: number | null;
  horas_sueno: number | null;
  hidratacion_ok: number | null;
  lesiones_ultimo_anno: number | null;
  recuperacion_sem: number | null;
  posicion: string;
  nivel: string;
  superficie: string;
  clima: string;
  dolor_nivel: number | null;
  dolor_zona: string;
  dolor_dias: number | null;
}

@Component({
  selector: 'app-condition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './condition.component.html',
  styleUrl: './condition.component.css'
})
export class ConditionComponent {
  today = new Date();

  conditionForm: ConditionForm = {
    usuario_id: null,   // se llenará con el uid/email del usuario

    edad: 22,
    peso: 63,
    estatura_m: 1.63,
    duracion_partido_min: 90,
    frecuencia_juego_semana: 2,
    entrena: 1,
    calienta: 1,
    calentamiento_min: 15,
    horas_sueno: 7,
    hidratacion_ok: 1,
    lesiones_ultimo_anno: 1,
    recuperacion_sem: 1,
    posicion: '1',
    nivel: 'intermedio',
    superficie: 'pasto',
    clima: 'templado',
    dolor_nivel: 4,
    dolor_zona: 'tobillo izquierdo',
    dolor_dias: 3
  };

  submitMessage = '';
  cargando = false;
  error = '';
  recomendacion: any | null = null;

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {
    // Escuchamos el usuario que está loggeado
    this.authService.authChanges().subscribe((user) => {
      const usuarioId = user?.uid || user?.email || null;
      this.conditionForm.usuario_id = usuarioId;
      console.log('usuario_id desde Firebase/Auth =>', usuarioId);
    });
  }

  onSubmit() {
    this.cargando = true;
    this.error = '';
    this.submitMessage = '';
    this.recomendacion = null;

    this.recommendationService.generarRecomendacion(this.conditionForm).subscribe({
      next: (respuesta) => {
        console.log('Respuesta del backend:', respuesta);
        this.cargando = false;
        this.recomendacion = respuesta;
        this.submitMessage = 'Recomendación generada correctamente.';
      },
      error: (error) => {
        console.error('Error al generar recomendación:', error);
        this.cargando = false;
        this.error = 'Ocurrió un error al generar la recomendación.';
      }
    });
  }
}