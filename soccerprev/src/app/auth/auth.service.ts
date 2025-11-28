import { Injectable, inject } from '@angular/core';
// 💥 IMPORTS DE AUTH (incluye reset de contraseña)
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

// 👇 docData para leer el perfil desde Firestore
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // ===========================
  //   OBSERVABLE DE USUARIO
  // ===========================
  authChanges(): Observable<User | null> {
    return authState(this.auth);
  }

  // ===========================
  //   SABER SI HAY SESIÓN
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
  //        PERFIL (LECTURA)
  // ===========================
  /**
   * Lee el documento de Firestore en la colección "users" con id = uid
   * para obtener los datos de perfil del jugador.
   */
  getUserProfile(uid: string): Observable<any> {
    const ref = doc(this.firestore, 'users', uid);
    // idField añade el campo "id" al objeto resultante con el uid del documento
    return docData(ref, { idField: 'id' });
  }

  // ===========================
  //          REGISTRO
  // ===========================
  async registerUser(email: string, password: string, data: any): Promise<void> {

    // 1. Crear el usuario en Firebase Authentication
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = credential.user; // Obtener el objeto User
    const uid = user.uid;

    await sendEmailVerification(user);

    // 2. Guardar datos adicionales en Firestore
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
  //           LOGIN
  // ===========================
  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  // ===========================
  //   RESTABLECER CONTRASEÑA
  // ===========================
  async resetPassword(email: string): Promise<void> {
    // Llama a la función de Firebase para enviar el correo
    return sendPasswordResetEmail(this.auth, email);
  }

  // ===========================
  //           LOGOUT
  // ===========================
  async logout() {
    await signOut(this.auth);
  }
}