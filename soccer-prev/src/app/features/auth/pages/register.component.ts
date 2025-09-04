import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

function passwordMatchValidator(passKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get(passKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  // ✅ Un solo "imports" y con arreglo literal de símbolos
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="card">
      <h2 class="text-xl font-semibold text-gray-800 mb-1">Crear cuenta</h2>
      <p class="page-subtitle mb-6">Regístrate para comenzar a usar SOCCER-PREV</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Nombre -->
        <div>
          <label class="label">Nombre</label>
          <input type="text" formControlName="displayName" class="input" placeholder="Tu nombre" autocomplete="name" />
          <div class="error" *ngIf="touched('displayName') && form.get('displayName')?.invalid">
            <span *ngIf="form.get('displayName')?.errors?.['required']">El nombre es obligatorio.</span>
            <span *ngIf="form.get('displayName')?.errors?.['minlength']">Mínimo 2 caracteres.</span>
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="label">Correo</label>
          <input type="email" formControlName="email" class="input" placeholder="tu@correo.com" autocomplete="email" />
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
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
            />
            <button type="button"
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

        <!-- Confirm Password -->
        <div>
          <label class="label">Confirmar contraseña</label>
          <input [type]="showPassword ? 'text' : 'password'" formControlName="confirmPassword" class="input" placeholder="Repite tu contraseña" autocomplete="new-password" />
          <div class="error" *ngIf="(touched('confirmPassword') || form.errors?.['passwordMismatch'])">
            <span *ngIf="form.errors?.['passwordMismatch']">Las contraseñas no coinciden.</span>
          </div>
        </div>

        <!-- Términos -->
        <label class="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" formControlName="terms" class="mt-1 rounded border-gray-300">
          <span>Acepto los términos y condiciones</span>
        </label>
        <div class="error" *ngIf="touched('terms') && form.get('terms')?.invalid">
          Debes aceptar los términos.
        </div>

        <button class="btn btn-primary w-full" [disabled]="form.invalid || pending">
          {{ pending ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>

        <div class="text-sm text-red-600 mt-2" *ngIf="errorMsg">{{ errorMsg }}</div>
      </form>

      <div class="text-sm text-gray-600 mt-4">
        ¿Ya tienes cuenta?
        <a routerLink="/login" class="text-primary-700 font-semibold hover:underline">Inicia sesión</a>
      </div>
    </div>
  `
})
export class RegisterComponent {
  form: FormGroup;
  showPassword = false;
  pending = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group(
      {
        displayName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      { validators: passwordMatchValidator('password', 'confirmPassword') }
    );
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
    }, 900);
  }
}
