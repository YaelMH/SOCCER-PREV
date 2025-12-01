import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecommendationFeedbackPayload {
  usuario_id: string;
  recomendacion_id: number;
  aplicada: boolean;
  util_prevenir: number;   // 1–10
  claridad: number;        // 1–10
  estrellas: number;       // 1–5
  comentario: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  // URL base del backend (por ejemplo: http://localhost:3000/api/recomendacion)
  private apiUrl = `${environment.backendUrl}/recomendacion`;

  constructor(private http: HttpClient) {}

  // ============================
  //    RECOMENDACIÓN PRINCIPAL
  // ============================

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

  // ============================
  //           FEEDBACK
  // ============================

  /**
   * Envía el feedback que el usuario hace sobre una recomendación concreta.
   * Se consumirá en el backend en la ruta:
   *   POST /api/recomendacion/feedback
   */
  enviarFeedback(payload: RecommendationFeedbackPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/feedback`, payload);
  }
}