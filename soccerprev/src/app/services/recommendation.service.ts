// src/app/services/recommendation.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  // Ahora usamos la URL del environment
  private apiUrl = `${environment.backendUrl}/recomendacion`;

  constructor(private http: HttpClient) {}

  // POST para generar recomendación
  generarRecomendacion(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // GET historial por usuario
  obtenerHistorial(usuarioId: string, limit: number = 10): Observable<any[]> {
    const params = {
      usuario_id: usuarioId,
      limit: limit.toString()
    };
    return this.http.get<any[]>(`${this.apiUrl}/historial`, { params });
  }
}