import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 👇 Importamos tu AuthService para leer el perfil
import { AuthService } from '../../auth/auth.service';

interface Injury {
  zone: string;
  severity: string;
  description: string;
  date: string;
}

interface Profile {
  fullName: string;
  email: string;
  role: 'player' | 'coach' | 'staff';
  position: string;
  age: number;
  dominantLeg: 'derecha' | 'izquierda' | 'ambas';
  matchesPerWeek: number;
  trainingsPerWeek: number;
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

  // Valores por defecto (por si aún no hay datos en Firestore)
  profile: Profile = {
    fullName: 'Juan Pérez',
    email: 'juan.perez@escom.ipn.mx',
    role: 'player',
    position: 'Delantero',
    age: 21,
    dominantLeg: 'derecha',
    matchesPerWeek: 1,
    trainingsPerWeek: 3,
    injuryHistory: true,
    injuries: [
      {
        zone: 'Rodilla derecha',
        severity: 'Moderada',
        description: 'Lesión por sobrecarga durante pretemporada.',
        date: '2024-08'
      }
    ]
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // 1) Escuchar sesión actual
    this.authService.authChanges().subscribe((user) => {
      if (!user) {
        return;
      }

      // 2) Leer documento de perfil en Firestore: users/{uid}
      this.authService.getUserProfile(user.uid).subscribe((data) => {
        if (!data) {
          return;
        }

        const fullName = `${data.nombre ?? ''} ${data.apellidoPaterno ?? ''} ${data.apellidoMaterno ?? ''}`.trim();
        const age = data.birthDate
          ? this.calcularEdad(data.birthDate)
          : this.profile.age;

        // 3) Actualizar el perfil mostrado en la UI
        this.profile = {
          ...this.profile,
          fullName: fullName || this.profile.fullName,
          email: data.email ?? this.profile.email,
          position: data.position ?? this.profile.position,
          age: age
          // Si después guardan más campos en Firestore (pierna dominante, partidos, etc.)
          // los puedes ir mapeando aquí igual.
        };
      });
    });
  }

  toggleEdit() {
    this.editing = !this.editing;
  }

  getRoleLabel(role: Profile['role']): string {
    switch (role) {
      case 'player':
        return 'Jugador';
      case 'coach':
        return 'Entrenador';
      case 'staff':
        return 'Staff médico';
      default:
        return '';
    }
  }

  // ===========================
  //     UTIL: calcular edad
  // ===========================
  private calcularEdad(fecha: string | Date): number {
    const nacimiento = new Date(fecha);
    if (Number.isNaN(nacimiento.getTime())) {
      return this.profile.age;
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