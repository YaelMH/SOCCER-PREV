// src/app/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';

// AUTH
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

// Persistencia
import { browserSessionPersistence, setPersistence } from 'firebase/auth';

// FIRESTORE
import {
  Firestore,
  doc,
  setDoc,
  docData,
  getDoc
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
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
  //  PERFIL (LECTURA)
  // ===========================
  getUserProfile(uid: string): Observable<any> {
    const ref = doc(this.firestore, 'users', uid);
    return docData(ref, { idField: 'id' });
  }

  getUserData(uid: string): Observable<any> {
    return this.getUserProfile(uid);
  }

  // ===========================
  //  PERFIL (ESCRITURA / UPDATE)
  // ===========================
  async updateUserProfile(uid: string, partialData: any): Promise<void> {
    const ref = doc(this.firestore, 'users', uid);
    await setDoc(ref, partialData, { merge: true });
  }

  /**
   * Añadir una lesión al arreglo `injuries` del usuario.
   * La usamos cuando se genera una recomendación con dolor/molestia.
   */
  async addInjuryFromRecommendation(uid: string, injury: any): Promise<void> {
    const ref = doc(this.firestore, 'users', uid);
    const snap = await getDoc(ref);

    let currentInjuries: any[] = [];
    if (snap.exists()) {
      const data = snap.data() as any;
      if (Array.isArray(data.injuries)) {
        currentInjuries = data.injuries;
      }
    }

    const newInjuries = [injury, ...currentInjuries];

    await setDoc(
      ref,
      {
        injuries: newInjuries,
        injuryHistory: newInjuries.length > 0
      },
      { merge: true }
    );
  }

  // ===========================
  //          REGISTRO
  // ===========================
  async registerUser(email: string, password: string, data: any): Promise<void> {

    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = credential.user;
    const uid = user.uid;

    try {
      await sendEmailVerification(user);

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

        dominantFoot: data.dominantFoot,
        level: data.level,

        // Por si luego quieres usarlo
        matchesPerWeek: data.matchesPerWeek ?? null,
        trainingsPerWeek: data.trainingsPerWeek ?? null,

        injuryHistory: false,
        injuries: [],

        createdAt: new Date()
      });

    } finally {
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
  // src/app/auth/auth.service.ts
  async resetPassword(email: string): Promise<void> {
  const actionCodeSettings = {
    url: 'http://soccreprev-front.onrender.com/restablecer-password',
    handleCodeInApp: true
  };
  return sendPasswordResetEmail(this.auth, email, actionCodeSettings);
}



  // ===========================
  //           LOGOUT
  // ===========================
  async logout() {
    await signOut(this.auth);
  }
}