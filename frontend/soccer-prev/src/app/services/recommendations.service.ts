import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface RecomendacionPayload {
  dolor_nivel: number;
  dolor_zona: string;
  dolor_dias: number;
}

export interface RecomendacionRespuesta {
  tipo_lesion: string;
  gravedad: string;
  descripcion: string;
  recomendaciones: string[];
  especialista: {
    necesario: boolean;
    urgente: boolean;
    motivo: string;
  };
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
  private readonly base = `${environment.apiBase}/recomendacion`;

  constructor(private http: HttpClient) {}

  generar(payload: RecomendacionPayload): Observable<RecomendacionRespuesta> {
    return this.http.post<RecomendacionRespuesta>(this.base, payload);
  }
}