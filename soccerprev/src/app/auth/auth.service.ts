import { Injectable, inject } from '@angular/core';

// IMPORTS DE AUTH DE ANGULARFIRE (para User, authState, y funciones envueltas)
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

// 💡 IMPORTS CORREGIDOS: setPersistence y browserLocalPersistence NO están en @angular/fire/auth.
// Deben importarse directamente del SDK de Firebase ('firebase/auth').
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// IMPORTS DE FIRESTORE
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // ===========================
  //  OBSERVABLE DE SESIÓN
  // ===========================
  authChanges(): Observable<User | null> {
    return authState(this.auth);
  }

  // ===========================
  //   ESPERAR A LA CARGA INICIAL DE FIREBASE (Mantenido para el guard)
  // ===========================
  // (No se usa directamente en este archivo, pero es útil)
  // ... [waitForAuthLoad() method goes here, removed for brevity]

  // ===========================
  //      PERFIL (LECTURA)
  // ===========================
  getUserProfile(uid: string): Observable<any> {
    const ref = doc(this.firestore, 'users', uid);
    return docData(ref, { idField: 'id' });
  }

  getUserData(uid: string): Observable<any> {
    return this.getUserProfile(uid);
  }

  // ===========================
  //          REGISTRO
  // ===========================
  async registerUser(email: string, password: string, data: any): Promise<void> {

    // 1. Crear el usuario en Firebase Authentication
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = credential.user;
    const uid = user.uid;

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
      subPosition: data.subPosition,

      createdAt: new Date()
    });
  }

  // ===========================
  //           LOGIN
  // ===========================
  async login(email: string, password: string) {
    // 💡 Paso crucial: Configurar la persistencia para que sobreviva al cierre de la pestaña.
    // setPersistence y browserLocalPersistence ya están importados correctamente.
    await setPersistence(this.auth, browserLocalPersistence);
    
    // Luego, realiza el inicio de sesión
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  // ===========================
  //   RESTABLECER CONTRASEÑA
  // ===========================
  async resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  // ===========================
  //           LOGOUT
  // ===========================
  async logout() {
    await signOut(this.auth);
  }
}