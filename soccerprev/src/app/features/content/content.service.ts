// src/app/content/content.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  // Usamos backendUrl del environment
  private readonly baseUrl = `${environment.backendUrl}/contenido-preventivo`;

  constructor(private http: HttpClient) {}

  getPreventiveContent(): Observable<PreventiveContent[]> {
    return this.http.get<PreventiveContent[]>(this.baseUrl);
  }
}
