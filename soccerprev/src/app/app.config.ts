import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // aquí dejo lo que Angular trae por default para zonas
    provideZoneChangeDetection({ eventCoalescing: true }),
    // aquí doy de alta el router con mis rutas
    provideRouter(routes)
  ]
};
