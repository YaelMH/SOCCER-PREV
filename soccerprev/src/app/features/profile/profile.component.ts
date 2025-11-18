import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class ProfileComponent {
  editing = false;

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
}
