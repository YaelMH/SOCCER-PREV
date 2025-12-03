import { Injectable, inject } from '@angular/core';

// IMPORTS DE AUTH (incluye reset de contraseña)
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  authState,
  User,
  sendEmailVerification,
  sendPasswordResetEmail
} from '@angular/fire/auth';

// 👇 Importamos la persistencia de Firebase (SDK base)
import { browserSessionPersistence, setPersistence } from 'firebase/auth';

// IMPORTS DE FIRESTORE (incluye docData para leer perfil)
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
    // 🔥 Persistencia por sesión de pestaña:
    // - Cierra sesión al CERRAR la pestaña.
    // - Si solo recargas la misma pestaña, la sesión sigue (comportamiento normal).
    setPersistence(this.auth, browserSessionPersistence)
      .then(() => {
        console.log('[AuthService] Persistencia configurada a browserSessionPersistence');
      })
      .catch((err) => {
        console.error('[AuthService] Error configurando persistencia:', err);
      });
  }

  // ===========================
  //  OBSERVABLE DE SESIÓN
  // ===========================
  authChanges(): Observable<User | null> {
    return authState(this.auth);
  }

  // ===========================
  //  SABER SI HAY USUARIO ACTIVO
  // ===========================
  isAuthenticated(): Promise<boolean> {
    return new Promise(resolve => {
      const sub = this.authChanges().subscribe(user => {
        resolve(!!user);
        sub.unsubscribe();
      });
    });
  }

  // ===========================
  //      PERFIL (LECTURA)
  // ===========================
  getUserProfile(uid: string): Observable<any> {
    const ref = doc(this.firestore, 'users', uid);
    return docData(ref, { idField: 'id' });
  }

  getUserData(uid: string): Observable<any> {
    return this.getUserProfile(uid);
  }

  // ===========================
  //          REGISTRO
  // ===========================
  async registerUser(email: string, password: string, data: any): Promise<void> {

    // 1. Crear el usuario en Firebase Authentication
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = credential.user;
    const uid = user.uid;

    try {
      // 2. Enviar verificación de correo
      await sendEmailVerification(user);

      // 3. Guardar datos adicionales en Firestore
      await setDoc(doc(this.firestore, 'users', uid), {
        email: email,

        nombre: data.firstName,
        apellidoPaterno: data.lastNameP,
        apellidoMaterno: data.lastNameM,

        birthDate: data.birthDate,
        height: data.height,
        weight: data.weight,
        bmi: data.bmi,
        position: data.position,

        // 🔹 Nuevos campos
        dominantFoot: data.dominantFoot,
        level: data.level,

        createdAt: new Date()
      });

    } finally {
      // Siempre cerramos sesión tras el registro
      await signOut(this.auth);
    }
  }

  // ===========================
  //           LOGIN
  // ===========================
  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  // ===========================
  //   RESTABLECER CONTRASEÑA
  // ===========================
  async resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  // ===========================
  //           LOGOUT
  // ===========================
  async logout() {
    await signOut(this.auth);
  }
}
