import { Injectable, inject } from '@angular/core';
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

import {
  Firestore,
  doc,
  setDoc,
  docData
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // ============================
  //    OBSERVABLE DE USUARIO
  // ============================
  authChanges(): Observable<User | null> {
    return authState(this.auth);
  }

  // ============================
  //   OBTENER DATOS FIRESTORE
  // ============================
  getUserData(uid: string): Observable<any> {
    const ref = doc(this.firestore, 'users', uid);
    return docData(ref, { idField: 'id' });
  }

  // ============================
  //          REGISTRO
  // ============================
  async registerUser(email: string, password: string, data: any): Promise<void> {

    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = credential.user;
    const uid = user.uid;

    await sendEmailVerification(user);

    // Guardar datos adicionales en Firestore
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

  // ============================
  //            LOGIN
  // ============================
  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // ============================
  //   RESTABLECER CONTRASEÑA
  // ============================
  async resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  // ============================
  //            LOGOUT
  // ============================
  async logout() {
    await signOut(this.auth);
  }
}
