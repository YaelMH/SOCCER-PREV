import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="card">
      <h2 class="text-xl font-semibold text-gray-800 mb-1">Iniciar sesión</h2>
      <p class="page-subtitle mb-6">Accede a tu cuenta para continuar</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Email -->
        <div>
          <label class="label">Correo</label>
          <input
            type="email"
            formControlName="email"
            class="input"
            placeholder="tu@correo.com"
            autocomplete="email"
          />
          <div class="error" *ngIf="touched('email') && form.get('email')?.invalid">
            <span *ngIf="form.get('email')?.errors?.['required']">El correo es obligatorio.</span>
            <span *ngIf="form.get('email')?.errors?.['email']">Correo inválido.</span>
          </div>
        </div>

        <!-- Password -->
        <div>
          <label class="label">Contraseña</label>
          <div class="relative">
            <input
              [type]="showPassword ? 'text' : 'password'"
              formControlName="password"
              class="input pr-10"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button
              type="button"
              (click)="showPassword = !showPassword"
              class="absolute inset-y-0 right-2 my-auto text-gray-500 text-sm px-2 rounded-lg hover:bg-gray-100">
              {{ showPassword ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
          <div class="error" *ngIf="touched('password') && form.get('password')?.invalid">
            <span *ngIf="form.get('password')?.errors?.['required']">La contraseña es obligatoria.</span>
            <span *ngIf="form.get('password')?.errors?.['minlength']">Mínimo 8 caracteres.</span>
          </div>
        </div>

        <button class="btn btn-primary w-full" [disabled]="form.invalid || pending">
          {{ pending ? 'Entrando…' : 'Entrar' }}
        </button>

        <div class="text-sm text-red-600 mt-2" *ngIf="errorMsg">{{ errorMsg }}</div>
      </form>

      <div class="text-sm text-gray-600 mt-4">
        ¿No tienes cuenta?
        <a routerLink="/register" class="text-primary-700 font-semibold hover:underline">Crear cuenta</a>
      </div>
    </div>
  `
})
export class LoginComponent {
  form: FormGroup;
  showPassword = false;
  pending = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  touched(ctrl: string) {
    const c = this.form.get(ctrl);
    return !!(c && (c.touched || c.dirty));
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.pending = true;
    setTimeout(() => {
      this.pending = false;
      this.router.navigateByUrl('/profile');
    }, 700);
  }
}
