// src/app/features/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

type InjurySeverity = 'Leve' | 'Moderada' | 'Grave';
type DominantLeg = 'derecha' | 'izquierda' | '';

interface Injury {
  id?: number | string;
  date: string;
  zone: string;
  type: string;
  description: string;
  severity: InjurySeverity;
  recoveryTime: string;
  origin?: 'manual' | 'recomendacion' | string;
}

interface Profile {
  // Nombre (como en el registro)
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  fullName: string;

  // Datos de cuenta
  email: string;

  // Datos deportivos
  position: string;                 // Portero / Defensa / Medio / Delantero
  birthDate: string | null;
  age: number | null;
  dominantLeg: DominantLeg;
  height: number | null;            // en metros
  weight: number | null;            // en kg
  bmi: number | null;
  level: 'básico' | 'intermedio' | 'avanzado' | '';

  matchesPerWeek: number | null;
  trainingsPerWeek: number | null;

  // Lesiones
  injuryHistory: boolean;
  injuries: Injury[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  editing = false;
  saving = false;
  saveError = '';

  private currentUid: string | null = null;

  profile: Profile = {
    firstName: 'Nombre',
    lastNameP: 'Apellido P.',
    lastNameM: 'Apellido M.',
    fullName: 'Nombre completo',
    email: 'sin-correo@example.com',

    position: 'Sin posición registrada',
    birthDate: null,
    age: null,
    dominantLeg: '',
    height: null,
    weight: null,
    bmi: null,
    level: '',

    matchesPerWeek: null,
    trainingsPerWeek: null,

    injuryHistory: false,
    injuries: []
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.authChanges().subscribe(user => {
      if (!user) {
        this.currentUid = null;
        return;
      }

      this.currentUid = user.uid;

      this.authService.getUserProfile(user.uid).subscribe(data => {
        if (!data) return;

        // --- Nombre y datos personales ---
        const firstName = (data.nombre ?? this.profile.firstName) as string;
        const lastNameP = (data.apellidoPaterno ?? this.profile.lastNameP) as string;
        const lastNameM = (data.apellidoMaterno ?? this.profile.lastNameM) as string;

        const fullName =
          `${firstName} ${lastNameP} ${lastNameM}`.trim() || this.profile.fullName;

        const birthDate = (data.birthDate ?? this.profile.birthDate) as string | null;
        const age = birthDate ? this.calcularEdad(birthDate) : this.profile.age;

        // --- Pierna dominante ---
        const domRaw = ((data.dominantFoot ?? '') as string).toLowerCase();
        let dominantLeg: DominantLeg = this.profile.dominantLeg;
        if (domRaw === 'derecha' || domRaw === 'right') dominantLeg = 'derecha';
        else if (domRaw === 'izquierda' || domRaw === 'left') dominantLeg = 'izquierda';

        // --- Nivel ---
        const levelRaw = ((data.level ?? '') as string).toLowerCase();
        let level: Profile['level'] = this.profile.level;
        if (levelRaw === 'basico' || levelRaw === 'básico') level = 'básico';
        else if (levelRaw === 'intermedio') level = 'intermedio';
        else if (levelRaw === 'avanzado') level = 'avanzado';

        // --- Lesiones desde Firestore ---
        const rawInjuries: any[] = Array.isArray(data.injuries) ? data.injuries : [];
        const injuries: Injury[] = rawInjuries.map((inj, idx) => ({
          id: inj.id ?? idx,
          date: inj.date ?? '',
          zone: inj.zone ?? 'Zona no especificada',
          type: inj.type ?? 'Lesión',
          description:
            inj.description ??
            'Lesión registrada automáticamente a partir de una recomendación.',
          severity: (inj.severity ?? 'Moderada') as InjurySeverity,
          recoveryTime: inj.recoveryTime ?? 'Por definir según evolución',
          origin: inj.origin ?? 'manual'
        }));

        this.profile = {
          ...this.profile,
          firstName,
          lastNameP,
          lastNameM,
          fullName,
          email: (data.email ?? this.profile.email) as string,
          position: (data.position ?? this.profile.position) as string,
          birthDate,
          age,
          dominantLeg,
          height:
            data.height !== undefined && data.height !== null
              ? Number(data.height)
              : this.profile.height,
          weight:
            data.weight !== undefined && data.weight !== null
              ? Number(data.weight)
              : this.profile.weight,
          bmi:
            data.bmi !== undefined && data.bmi !== null
              ? Number(data.bmi)
              : this.profile.bmi,
          level,
          matchesPerWeek:
            data.matchesPerWeek !== undefined && data.matchesPerWeek !== null
              ? Number(data.matchesPerWeek)
              : this.profile.matchesPerWeek,
          trainingsPerWeek:
            data.trainingsPerWeek !== undefined && data.trainingsPerWeek !== null
              ? Number(data.trainingsPerWeek)
              : this.profile.trainingsPerWeek,
          injuryHistory: injuries.length > 0,
          injuries
        };
      });
    });
  }

  // =========================
  //  Editar / guardar perfil
  // =========================
  toggleEdit() {
    if (!this.editing) {
      this.editing = true;
      this.saveError = '';
      return;
    }
    this.guardarPerfil();
  }

  async guardarPerfil() {
    if (!this.currentUid) {
      this.saveError = 'No hay usuario autenticado.';
      return;
    }

    this.saving = true;
    this.saveError = '';

    try {
      this.recalcularBMI();

      await this.authService.updateUserProfile(this.currentUid, {
        nombre: this.profile.firstName.trim(),
        apellidoPaterno: this.profile.lastNameP.trim(),
        apellidoMaterno: this.profile.lastNameM.trim(),
        birthDate: this.profile.birthDate,
        height: this.profile.height,
        weight: this.profile.weight,
        bmi: this.profile.bmi,
        position: this.profile.position,
        dominantFoot: this.profile.dominantLeg,
        level: this.profile.level,
        matchesPerWeek: this.profile.matchesPerWeek,
        trainingsPerWeek: this.profile.trainingsPerWeek,
        injuryHistory: this.profile.injuries.length > 0,
        injuries: this.profile.injuries
      });

      this.editing = false;
    } catch (err) {
      console.error('[Profile] Error al guardar perfil:', err);
      this.saveError = 'Ocurrió un error al guardar los cambios.';
    } finally {
      this.saving = false;
    }
  }

  // =========================
  //  Lesiones (botones)
  // =========================
  addInjury() {
    if (!this.editing) return;

    const nueva: Injury = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      zone: '',
      type: 'Lesión',
      description: '',
      severity: 'Moderada',
      recoveryTime: 'Por definir',
      origin: 'manual'
    };

    this.profile.injuries = [nueva, ...this.profile.injuries];
  }

  removeInjury(index: number) {
    if (!this.editing) return;
    if (index < 0 || index >= this.profile.injuries.length) return;

    this.profile.injuries = this.profile.injuries.filter((_, i) => i !== index);
  }

  // =========================
  //  Utils
  // =========================
  recalcularBMI() {
    const h = this.profile.height;
    const w = this.profile.weight;

    if (h && h > 0 && w && w > 0) {
      const bmi = w / (h * h);
      this.profile.bmi = Number(bmi.toFixed(2));
    } else {
      this.profile.bmi = null;
    }
  }

  private calcularEdad(fecha: string | Date): number {
    const nacimiento = new Date(fecha);
    if (Number.isNaN(nacimiento.getTime())) {
      return this.profile.age ?? 0;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }
}
