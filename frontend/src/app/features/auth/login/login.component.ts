import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Form definition with strict email regex validation
  readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],
    password: ['', [Validators.required]]
  });

  // State signals
  readonly isPasswordHidden = signal(true);
  readonly isLoading = signal(false);

  togglePasswordVisibility() {
    this.isPasswordHidden.update(hidden => !hidden);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Login successful! Welcome back.');
          this.router.navigate(['/home']);
        } else {
          this.toastService.error(res.message || 'Login failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || 'Invalid Email or Password';
        this.toastService.error(errorMsg);
      }
    });
  }
}
