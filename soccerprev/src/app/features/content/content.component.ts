import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService, ContentType, PreventiveContent } from './content.service';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css'
})
export class ContentComponent implements OnInit {
  selectedType: ContentType | 'todos' = 'todos';

  contents: PreventiveContent[] = [];
  loading = false;
  errorMessage = '';

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
}
