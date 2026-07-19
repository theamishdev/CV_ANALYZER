import { Component, inject, signal, computed } from '@angular/core';
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
  
  // Custom password strength regexes
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

  // Live Password Metrics Computed Signals
  readonly passwordValue = signal('');
  
  readonly pwdMetrics = computed(() => {
    const val = this.passwordValue();
    if (!val) {
      return {
        score: 0,
        label: 'None',
        colorClass: '',
        requirements: { length: false, upper: false, lower: false, num: false, spec: false }
      };
    }

    const reqs = {
      length: val.length >= 8,
      upper: this.hasUpper.test(val),
      lower: this.hasLower.test(val),
      num: this.hasNum.test(val),
      spec: this.hasSpec.test(val)
    };

    // Calculate score (0 to 5)
    let score = 0;
    if (reqs.length) score++;
    if (reqs.upper) score++;
    if (reqs.lower) score++;
    if (reqs.num) score++;
    if (reqs.spec) score++;

    let label = 'Weak';
    let colorClass = 'weak';

    if (score === 5) {
      label = 'Strong';
      colorClass = 'strong';
    } else if (score >= 3) {
      label = 'Medium';
      colorClass = 'medium';
    }

    return { score, label, colorClass, requirements: reqs };
  });

  constructor() {
    // Sync password field changes into a signal for real-time computations
    this.signupForm.get('password')?.valueChanges.subscribe(val => {
      this.passwordValue.set(val || '');
    });
  }

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
        const errorMsg = err.error?.message || 'Registration failed. Please check inputs.';
        this.toastService.error(errorMsg);
      }
    });
  }
}
