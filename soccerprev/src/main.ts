import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err: unknown) => {
    // aquí solo lo mando a consola, no necesito más
    console.error(err);
  });
