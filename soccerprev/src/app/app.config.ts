import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';

import { provideAnimations } from '@angular/platform-browser/animations';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUrL2txjWdPlWr2J3ZD3dqpmSOp3FjFlI",
  authDomain: "soccerprev-96e6a.firebaseapp.com",
  projectId: "soccerprev-96e6a",
  storageBucket: "soccerprev-96e6a.firebasestorage.app",
  messagingSenderId: "513293705227",
  appId: "1:513293705227:web:d595c649adedc55458a70e",
  measurementId: "G-4D46C0NBQ2"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),

    // Manejo de zonas
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Rutas
    provideRouter(routes),

    // Animaciones
    provideAnimations(),

    // Firebase modular
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
