// src/app/features/content/content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService, ContentType, PreventiveContent } from './content.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe'; // ajusta ruta según tu árbol

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css'
})
export class ContentComponent implements OnInit {
  selectedType: ContentType | 'todos' = 'todos';

  contents: PreventiveContent[] = [];
  loading = false;
  errorMessage = '';

  // contenido seleccionado para mostrar en visor
  selectedContent: PreventiveContent | null = null;

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadContent();
  }

  private loadContent(): void {
    this.loading = true;
    this.errorMessage = '';

    this.contentService.getPreventiveContent().subscribe({
      next: (data) => {
        this.contents = data;
        // seleccionamos el primero por defecto (opcional)
        this.selectedContent = this.contents.length > 0 ? this.contents[0] : null;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'No se pudo cargar el contenido preventivo.';
        this.loading = false;
      }
    });
  }

  get filteredContents(): PreventiveContent[] {
    return this.contents.filter((item) =>
      this.selectedType === 'todos' ? true : item.type === this.selectedType
    );
  }

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

  // al dar clic en una tarjeta
  selectContent(item: PreventiveContent) {
    this.selectedContent = item;
  }
}
