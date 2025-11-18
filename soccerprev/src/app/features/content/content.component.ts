import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <- aquí importo FormsModule

type ContentType = 'video' | 'infografia' | 'articulo';

interface PreventiveContent {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration: string;
  focusZone: string;
  level: 'básico' | 'intermedio' | 'avanzado';
}

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule // <- aquí habilito ngModel en el template de este componente
  ],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css'
})
export class ContentComponent {
  // aquí defino los filtros que quiero aplicar en la vista
  selectedType: ContentType | 'todos' = 'todos';
  selectedLevel: PreventiveContent['level'] | 'todos' = 'todos';

  // aquí simulo el contenido multimedia preventivo (después lo saco del backend)
  contents: PreventiveContent[] = [
    {
      id: 'c1',
      title: 'Prevención de esguinces de tobillo',
      description: 'Secuencia de ejercicios para fortalecer tobillos y mejorar estabilidad antes del partido.',
      type: 'video',
      duration: '7 min',
      focusZone: 'Tobillos',
      level: 'básico'
    },
    {
      id: 'c2',
      title: 'Guía visual de estiramientos para isquiotibiales',
      description: 'Infografía con estiramientos recomendados para reducir riesgo de lesión en parte posterior del muslo.',
      type: 'infografia',
      duration: '5 min',
      focusZone: 'Isquiotibiales',
      level: 'intermedio'
    },
    {
      id: 'c3',
      title: 'Artículo: carga de entrenamiento y riesgo de lesión',
      description: 'Explicación breve de cómo la carga mal distribuida aumenta la probabilidad de lesión.',
      type: 'articulo',
      duration: '10 min',
      focusZone: 'Carga global',
      level: 'avanzado'
    },
    {
      id: 'c4',
      title: 'Video de calentamiento general previo al partido',
      description: 'Rutina general de movilidad, trote suave y estiramientos dinámicos.',
      type: 'video',
      duration: '8 min',
      focusZone: 'Cuerpo completo',
      level: 'básico'
    }
  ];

  // aquí aplico filtros de tipo y nivel
  get filteredContents(): PreventiveContent[] {
    return this.contents.filter((item) => {
      const matchType =
        this.selectedType === 'todos' ? true : item.type === this.selectedType;

      const matchLevel =
        this.selectedLevel === 'todos' ? true : item.level === this.selectedLevel;

      return matchType && matchLevel;
    });
  }

  // aquí mapeo el tipo a un texto que se vea bien en interfaz
  getTypeLabel(type: ContentType): string {
    switch (type) {
      case 'video':
        return 'Video';
      case 'infografia':
        return 'Infografía';
      case 'articulo':
        return 'Artículo';
      default:
        return '';
    }
  }
}
