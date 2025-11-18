import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  constructor(private router: Router, private AuthService: AuthService) {}

  onSubmit() {
    if (!this.form.email || !this.form.password) return;

    this.loading = true;
    this.errorMessage = '';

    setTimeout(() => {
      this.AuthService.login(this.form.email, this.form.password);
      this.loading = false;
      this.router.navigate(['/dashboard']); // futura ruta de panel principal
    }, 700);
  }

  goToRecover() {
    this.router.navigate(['/recuperar-password']); // CU7
  }

  goToRegister() {
    this.router.navigate(['/registro']); // CU2
  }
}
