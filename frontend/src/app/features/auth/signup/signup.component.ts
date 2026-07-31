import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Form Setup
  readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Custom password strength regexes for form control validation
  readonly hasUpper = /[A-Z]/;
  readonly hasLower = /[a-z]/;
  readonly hasNum = /[0-9]/;
  readonly hasSpec = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\/`~#]/;

  readonly signupForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(this.hasUpper),
      Validators.pattern(this.hasLower),
      Validators.pattern(this.hasNum),
      Validators.pattern(this.hasSpec)
    ]]
  });

  // State Signals
  readonly isPasswordHidden = signal(true);
  readonly isLoading = signal(false);

  togglePasswordVisibility() {
    this.isPasswordHidden.update(hidden => !hidden);
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { name, email, password } = this.signupForm.value;

    this.authService.signup(name, email, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Account created successfully! Please login.');
          this.router.navigate(['/login']);
        } else {
          this.toastService.error(res.message || 'Signup failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        let errorMsg = 'Registration failed. Please check inputs.';
        if (err.error && typeof err.error === 'object' && err.error.message) {
          errorMsg = err.error.message;
        } else if (typeof err.error === 'string' && err.error.trim().length > 0) {
          errorMsg = err.error;
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.toastService.error(errorMsg);
      }
    });
  }
}

