import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "soccer-prev-9ead6", appId: "1:49211637394:web:797b8e1210651bd6b6704b", storageBucket: "soccer-prev-9ead6.firebasestorage.app", apiKey: "AIzaSyAy6vaBROGFpQmbTUXMsyVjUJidoueyu-w", authDomain: "soccer-prev-9ead6.firebaseapp.com", messagingSenderId: "49211637394" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideDatabase(() => getDatabase())]
};
