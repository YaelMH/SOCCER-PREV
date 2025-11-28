import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  // URL base del backend (por ejemplo: http://localhost:3000/api)
  private apiUrl = `${environment.backendUrl}/recomendacion`;

  constructor(private http: HttpClient) {}

  // POST para generar una nueva recomendación
  generarRecomendacion(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // GET para traer el historial de recomendaciones del backend
  obtenerHistorial(usuarioId: string, limit = 10): Observable<any[]> {
    const params = {
      usuario_id: usuarioId,
      limit: limit.toString()
    };

    return this.http.get<any[]>(`${this.apiUrl}/historial`, { params });
  }
}