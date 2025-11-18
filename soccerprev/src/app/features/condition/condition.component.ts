import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MoodOption {
  value: 'muy_bien' | 'bien' | 'cansado' | 'molesto';
  label: string;
  emoji: string;
  color: string; // clases de Tailwind
}

interface ConditionForm {
  mood: MoodOption['value'] | null;
  sleepHours: number | null;
  fatigue: number | null;
  pain: number | null;
  discomfortAreas: string;
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

  moods: MoodOption[] = [
    {
      value: 'muy_bien',
      label: 'Muy bien',
      emoji: '💪',
      color: 'bg-accent/10 text-accent'
    },
    {
      value: 'bien',
      label: 'Bien',
      emoji: '🙂',
      color: 'bg-primary/10 text-primary'
    },
    {
      value: 'cansado',
      label: 'Cansado',
      emoji: '😮‍💨',
      color: 'bg-warning/10 text-warning'
    },
    {
      value: 'molesto',
      label: 'Con dolor',
      emoji: '🤕',
      color: 'bg-danger/10 text-danger'
    }
  ];

  conditionForm: ConditionForm = {
    mood: null,
    sleepHours: null,
    fatigue: null,
    pain: null,
    discomfortAreas: ''
  };

  submitMessage = '';

  onSubmit() {
    this.submitMessage = 'Condición registrada correctamente para el día de hoy.';

  }
}
