import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../auth/auth.service';

interface ConditionForm {
  usuario_id?: string | null;

  // DATOS DEL JUGADOR (solo lectura en UI, se llenan desde perfil)
  edad: number | null;
  peso: number | null;
  estatura_m: number | null;
  frecuencia_juego_semana: number | null;
  posicion: any;
  nivel: string;

  // DATOS DE LA SESIÓN (editables)
  duracion_partido_min: number | null;
  entrena: number | null;
  calienta: number | null;
  calentamiento_min: number | null;
  horas_sueno: number | null;
  hidratacion_ok: number | null;
  lesiones_ultimo_anno: number | null;
  recuperacion_sem: number | null;
  superficie: string;
  clima: string;

  // DOLOR (obligatorio)
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
export class ConditionComponent implements OnInit {
  today = new Date();

  // 👉 para resaltar en el navbar que estamos en "Recomendación"
  readonly activeNavItem = 'recomendacion'; // úsalo en el HTML si no usas routerLinkActive

  // para poder guardar la lesión luego
  private currentUserUid: string | null = null;

  conditionForm: ConditionForm = {
    usuario_id: null,

    // DATOS DEL JUGADOR (se rellenan desde perfil)
    edad: null,
    peso: null,
    estatura_m: null,
    frecuencia_juego_semana: null,
    posicion: '',
    nivel: '',

    // DATOS DE LA SESIÓN
    duracion_partido_min: null,
    entrena: null,
    calienta: null,
    calentamiento_min: null,
    horas_sueno: null,
    hidratacion_ok: null,
    lesiones_ultimo_anno: null,
    recuperacion_sem: null,
    superficie: '',
    clima: '',

    // DOLOR
    dolor_nivel: null,
    dolor_zona: '',
    dolor_dias: null
  };

  submitMessage = '';
  cargando = false;
  error = '';
  recomendacion: any | null = null;

  constructor(
    private recommendationService: RecommendationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.authChanges().subscribe((user) => {
      if (!user) {
        this.conditionForm.usuario_id = null;
        this.currentUserUid = null;
        return;
      }

      const usuarioId = user.uid || user.email || null;
      this.conditionForm.usuario_id = usuarioId;
      this.currentUserUid = user.uid;
      console.log('usuario_id desde Firebase/Auth =>', usuarioId);

      // 🔹 Traer datos del jugador desde Firestore
      this.authService.getUserProfile(user.uid).subscribe((data) => {
        if (!data) return;

        // Edad desde birthDate
        if (data.birthDate) {
          const edad = this.calcularEdad(data.birthDate);
          if (edad !== null) this.conditionForm.edad = edad;
        }

        if (data.weight !== undefined && data.weight !== null) {
          this.conditionForm.peso = Number(data.weight);
        }

        if (data.height !== undefined && data.height !== null) {
          this.conditionForm.estatura_m = Number(data.height);
        }

        if (data.position !== undefined && data.position !== null) {
          this.conditionForm.posicion = data.position;
        }

        if (data.level) {
          this.conditionForm.nivel = String(data.level);
        }

        if (data.matchesPerWeek !== undefined && data.matchesPerWeek !== null) {
          this.conditionForm.frecuencia_juego_semana = Number(data.matchesPerWeek);
        }
      });
    });
  }

  //     UTIL: calcular edad

  private calcularEdad(fecha: string | Date): number | null {
    const nacimiento = new Date(fecha);
    if (Number.isNaN(nacimiento.getTime())) {
      return null;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }


  //   LÓGICA CALENTAMIENTO 
  

  /**
   * Se llama cuando cambia el campo "calienta" (¿Realizaste calentamiento?).
   * value puede venir como string ("1", "0") o número (1, 0).
   */
  onCalientaChange(value: any) {
    const numeric =
      value === '' || value === null || value === undefined ? null : Number(value);

    this.conditionForm.calienta = numeric;

    // Si responde NO (0) o no ha seleccionado, limpiamos y "deshabilitamos" minutos
    if (numeric === 0 || numeric === null) {
      this.conditionForm.calentamiento_min = null;
    }
  }

  /**
   * Getter para saber si debe estar deshabilitado el input de minutos de calentamiento.
   * Úsalo en el HTML: [disabled]="deshabilitarCalentamientoMin"
   */
  get deshabilitarCalentamientoMin(): boolean {
    return this.conditionForm.calienta === 0 || this.conditionForm.calienta === null;
  }

  onSubmit() {
    this.cargando = true;
    this.error = '';
    this.submitMessage = '';
    this.recomendacion = null;

    // Validación mínima: dolor
    if (
      this.conditionForm.dolor_nivel === null ||
      this.conditionForm.dolor_dias === null ||
      !this.conditionForm.dolor_zona
    ) {
      this.cargando = false;
      this.error =
        'Por favor, completa al menos el nivel de dolor, los días con dolor y la zona principal para generar la recomendación.';
      return;
    }

    this.recommendationService.generarRecomendacion(this.conditionForm).subscribe({
      next: async (respuesta) => {
        console.log('Respuesta del backend:', respuesta);
        this.cargando = false;
        this.recomendacion = respuesta;
        this.submitMessage = 'Recomendación generada correctamente.';

        // ⭐ Crear lesión automática en el perfil
        if (this.currentUserUid && this.conditionForm.dolor_zona) {
          const gravedad = (respuesta.gravedad || '').toString().toLowerCase();

          const severity =
            gravedad === 'alta'
              ? 'Grave'
              : gravedad === 'media'
              ? 'Moderada'
              : 'Leve';

          const recoveryTime =
            gravedad === 'alta'
              ? '4–8 semanas aprox.'
              : gravedad === 'media'
              ? '2–4 semanas aprox.'
              : '1–2 semanas aprox.';

          const newInjury = {
            date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
            zone: this.conditionForm.dolor_zona,
            type: respuesta.tipo_lesion || 'Lesión estimada',
            description:
              respuesta.descripcion ||
              'Lesión generada a partir de la recomendación de hoy.',
            severity,
            recoveryTime
          };

          try {
            await this.authService.addInjuryFromRecommendation(
              this.currentUserUid,
              newInjury
            );
            console.log('Lesión automática guardada en el perfil:', newInjury);
          } catch (e) {
            console.error('Error guardando lesión automática en perfil:', e);
          }
        }
      },
      error: (error) => {
        console.error('Error al generar recomendación:', error);
        this.cargando = false;
        this.error = 'Ocurrió un error al generar la recomendación.';
      }
    });
  }
}