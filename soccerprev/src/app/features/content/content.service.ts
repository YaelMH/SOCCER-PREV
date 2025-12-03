// src/app/features/content/content.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ContentType = 'video' | 'infografia' | 'articulo';

export interface PreventiveContent {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration: string;
  focusZone: string;
  sourceName: string;
  sourceUrl: string;

  // campos para mostrar dentro de la app
  embedUrl?: string;      // para videos
  imageUrl?: string;      // para infografías
  keyPoints?: string[];   // para artículos / resúmenes
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  // ajusta el endpoint a como tengas montado tu backend
  private apiUrl = 'http://localhost:3000/api/contenido-preventivo';

  constructor(private http: HttpClient) {}

  getPreventiveContent(): Observable<PreventiveContent[]> {
    return this.http.get<PreventiveContent[]>(this.apiUrl);
  }
}
