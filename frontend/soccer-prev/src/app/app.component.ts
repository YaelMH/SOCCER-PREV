import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, JsonPipe } from '@angular/common';
import { RecommendationsService } from './services/recommendations.service';
import { RecomendacionPayload } from './services/recommendations.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    JsonPipe
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  fb = new FormBuilder();

  form = this.fb.group({
    dolor_nivel: [5],
    dolor_zona: ['tobillo'],
    dolor_dias: [3]
  });

  resultado: any = null;

  constructor(private recService: RecommendationsService) {}

  generar() {
  const payload = this.form.value as RecomendacionPayload;
  this.recService.generar(payload).subscribe(
    res => this.resultado = res,
    err => console.error(err)
  );
}
}
