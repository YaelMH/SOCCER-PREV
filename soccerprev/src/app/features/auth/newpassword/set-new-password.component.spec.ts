<!-- src/app/features/auth/set-new-password/set-new-password.component.html -->
<div class="w-full max-w-md mx-auto">
  <div class="bg-app-card border border-app-border rounded-2xl shadow-xl p-6 sm:p-8">
    <!-- Encabezado -->
    <div class="mb-6 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Nueva contraseña
      </p>
      <h1 class="mt-2 text-2xl sm:text-3xl font-bold">
        Establecer nueva contraseña
      </h1>
      <p class="mt-2 text-sm text-text-muted">
        Escribe tu nueva contraseña y confírmala. Debe tener al menos 8 caracteres,
        una mayúscula y un número.
      </p>
    </div>

    <!-- Mensaje global (éxito / error) -->
    <div
      *ngIf="message"
      class="text-xs mb-4 rounded-lg px-3 py-2"
      [ngClass]="{
        'bg-emerald-900/20 border border-emerald-500/40 text-emerald-300': messageType === 'success',
        'bg-red-900/20 border border-red-500/40 text-red-300': messageType === 'error'
      }"
    >
      {{ message }}
    </div>

    <!-- Formulario -->
    <form
      class="space-y-4"
      #pwdForm="ngForm"
      (ngSubmit)="onSubmit(pwdForm)"
      *ngIf="oobCode"
    >
      <!-- Nueva contraseña (con ojo, igual que registro) -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-text-main">Nueva contraseña</label>
        <div class="relative">
          <input
            [type]="passwordType"
            name="password"
            [(ngModel)]="password"
            required
            minlength="8"
            pattern="(?=.*[0-9])(?=.*[A-Z]).{8,}"
            #passwordField="ngModel"
            class="w-full rounded-xl border border-app-border bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition pr-10"
            placeholder="********"
          />

          <!-- Botón del Ojo (mismo estilo que en registro) -->
          <button
            type="button"
            (click)="togglePasswordVisibility('password')"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-primary transition h-full"
          >
            <svg
              *ngIf="passwordType === 'password'"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.98.88A.825.825 0 0 1 4.75 0h14.5a.825.825 0 0 1 .77.625L19.5 3h-15L3.98.88ZM15 5.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5h6Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
              />
            </svg>
            <svg
              *ngIf="passwordType === 'text'"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.042 12A8.25 8.25 0 0 0 10.25 1.5C5.875 1.5 2.25 5.125 2.25 9.5c0 4.375 3.625 8 7.992 8.5L12 17.5c4.375 0 8-3.625 8-8s-3.625-8-8-8z"
              />
            </svg>
          </button>
        </div>

        <!-- Mensaje de error específico de la contraseña -->
        <div
          *ngIf="passwordField.errors && (passwordField.dirty || passwordField.touched)"
          class="text-xs text-danger mt-1"
        >
          <span *ngIf="passwordField.errors['required']">
            La contraseña es obligatoria.
          </span>
          <span *ngIf="passwordField.errors['pattern']">
            Debe tener al menos 8 caracteres, una mayúscula y un número.
          </span>
        </div>
      </div>

      <!-- Confirmar contraseña (con ojo también) -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-text-main">Confirmar contraseña</label>
        <div class="relative">
          <input
            [type]="confirmPasswordType"
            name="confirmPassword"
            [(ngModel)]="confirmPassword"
            required
            minlength="8"
            class="w-full rounded-xl border border-app-border bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition pr-10"
            placeholder="********"
          />

          <!-- Botón del Ojo (mismo estilo) -->
          <button
            type="button"
            (click)="togglePasswordVisibility('confirm')"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-primary transition h-full"
          >
            <svg
              *ngIf="confirmPasswordType === 'password'"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.98.88A.825.825 0 0 1 4.75 0h14.5a.825.825 0 0 1 .77.625L19.5 3h-15L3.98.88ZM15 5.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5h6Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
              />
            </svg>
            <svg
              *ngIf="confirmPasswordType === 'text'"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.042 12A8.25 8.25 0 0 0 10.25 1.5C5.875 1.5 2.25 5.125 2.25 9.5c0 4.375 3.625 8 7.992 8.5L12 17.5c4.375 0 8-3.625 8-8s-3.625-8-8-8z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Botón -->
      <button
        type="submit"
        [disabled]="pwdForm.invalid || loading"
        class="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        <span *ngIf="!loading">Guardar contraseña</span>
        <span *ngIf="loading">Guardando...</span>
      </button>
    </form>

    <div class="mt-4 text-xs text-center text-text-muted">
      <button
        type="button"
        class="underline underline-offset-4 hover:text-primary"
        (click)="goToLogin()"
      >
        Volver al inicio de sesión
      </button>
    </div>
  </div>
</div>
