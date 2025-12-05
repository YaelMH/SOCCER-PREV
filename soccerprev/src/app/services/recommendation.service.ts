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

export interface PerfilLesionesPayload {
  usuario_id: string;
  fullName: string;
  email: string;
  role: 'player' | 'coach' | 'staff';
  position: string;
  age: number;
  dominantLeg: string;
  matchesPerWeek: number;
  trainingsPerWeek: number;
  injuryHistory: boolean;
  injuries: {
    zone: string;
    severity: string;
    description: string;
    date: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  // URL base del backend para este módulo:
  // dev:  http://localhost:3000/api/recomendacion
  // prod: https://soccerprev.onrender.com/api/recomendacion
  private apiUrl = `${environment.backendUrl}/api/recomendacion`;

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

  enviarFeedback(payload: RecommendationFeedbackPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/feedback`, payload);
  }

  // ============================
  //    PERFIL + LESIONES
  // ============================

  // POST: guardar perfil + historial de lesiones
  guardarPerfilLesiones(payload: PerfilLesionesPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/perfil-lesiones`, payload);
  }

  // GET: recuperar perfil de lesiones
  obtenerPerfilLesiones(usuarioId: string, limit = 20): Observable<any[]> {
    const params = {
      usuario_id: usuarioId,
      limit: limit.toString()
    };

    return this.http.get<any[]>(`${this.apiUrl}/perfil-lesiones`, { params });
  }

  // ============================
  //       ELIMINAR DATOS
  // ============================

  // DELETE: eliminar una recomendación del historial
  eliminarRecomendacion(
    usuarioId: string,
    recommendationId: string | number
  ): Observable<any> {
    const params = {
      usuario_id: usuarioId,
      recomendacion_id: String(recommendationId)
    };

    return this.http.delete<any>(`${this.apiUrl}/historial`, { params });
  }

  // DELETE: eliminar una lesión/evento del perfil
  eliminarLesion(
    usuarioId: string,
    injuryId: string | number
  ): Observable<any> {
    const params = {
      usuario_id: usuarioId,
      injury_id: String(injuryId)
    };

    return this.http.delete<any>(`${this.apiUrl}/perfil-lesiones`, { params });
  }
}