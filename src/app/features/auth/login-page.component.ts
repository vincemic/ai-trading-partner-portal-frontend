import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { LoginRequest } from '../../core/models/dto.models';

interface LoginForm {
  partner: string;
  userId: string;
  role: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-container">
            <img src="assets/logos/portal-logo-primary.svg" alt="PointC Trading Portal" class="portal-logo">
          </div>
          <h1 class="login-title">PointC Trading Portal</h1>
          <p class="login-subtitle">Access your EDI management dashboard</p>
        </div>

        @if (error()) {
          <div class="error-banner" role="alert">
            <span class="error-icon">⚠</span>
            <span class="error-message">{{ error() }}</span>
          </div>
        }

        @if (message()) {
          <div class="info-banner" role="alert">
            <span class="info-icon">ℹ</span>
            <span class="info-message">{{ message() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="partner" class="form-label">Partner Organization</label>
            <select id="partner" formControlName="partner" class="form-input" [class.error]="loginForm.get('partner')?.invalid && loginForm.get('partner')?.touched">
              <option value="">Select your organization</option>
              <option value="11111111-1111-1111-1111-111111111111">Acme Corporation</option>
              <option value="22222222-2222-2222-2222-222222222222">Global Logistics Inc</option>
              <option value="33333333-3333-3333-3333-333333333333">TechFlow Systems</option>
              <option value="44444444-4444-4444-4444-444444444444">MegaTrade Ltd</option>
              <option value="55555555-5555-5555-5555-555555555555">DataSync Partners</option>
            </select>
            @if (loginForm.get('partner')?.invalid && loginForm.get('partner')?.touched) {
              <div class="form-error">Please select your organization</div>
            }
          </div>

          <div class="form-group">
            <label for="userId" class="form-label">User ID</label>
            <input 
              type="text" 
              id="userId" 
              formControlName="userId" 
              class="form-input"
              [class.error]="loginForm.get('userId')?.invalid && loginForm.get('userId')?.touched"
              placeholder="Enter your user ID"
              autocomplete="username"
            >
            @if (loginForm.get('userId')?.invalid && loginForm.get('userId')?.touched) {
              <div class="form-error">User ID is required</div>
            }
          </div>

          <div class="form-group">
            <label for="role" class="form-label">Role</label>
            <select id="role" formControlName="role" class="form-input" [class.error]="loginForm.get('role')?.invalid && loginForm.get('role')?.touched">
              <option value="">Select your role</option>
              <option value="PartnerUser">Partner User</option>
              <option value="PartnerAdmin">Partner Admin</option>
              <option value="InternalSupport">Internal Support</option>
            </select>
            @if (loginForm.get('role')?.invalid && loginForm.get('role')?.touched) {
              <div class="form-error">Please select your role</div>
            }
          </div>

          <button 
            type="submit" 
            class="btn-primary login-btn"
            [disabled]="loginForm.invalid || loading()"
          >
            @if (loading()) {
              <span class="loading-spinner"></span>
              Signing In...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="login-footer">
          <p class="demo-notice">
            <span class="demo-badge">DEMO</span>
            This is a demonstration environment for the EDI Trading Partner Portal
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-navy) 0%, #2C4B73 100%);
      padding: 2rem;
    }

    .login-card {
      background: var(--white);
      border-radius: 0.75rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-container {
      margin-bottom: 1.5rem;
    }

    .portal-logo {
      width: 150px;
      height: auto;
    }

    .login-title {
      font-family: var(--font-heading);
      font-size: 1.875rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.5rem;
    }

    .login-subtitle {
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--primary-blue-gray);
      margin: 0;
    }

    .error-banner, .info-banner {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .error-banner {
      background: rgba(222, 72, 67, 0.1);
      color: var(--accent-coral);
      border: 1px solid rgba(222, 72, 67, 0.2);
    }

    .info-banner {
      background: rgba(23, 162, 184, 0.1);
      color: var(--info-blue);
      border: 1px solid rgba(23, 162, 184, 0.2);
    }

    .error-icon, .info-icon {
      margin-right: 0.5rem;
      font-size: 1rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--dark-gray);
      margin-bottom: 0.5rem;
    }

    .form-input {
      padding: 0.75rem;
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--dark-gray);
      background: var(--white);
      border: 2px solid #DEE2E6;
      border-radius: 0.375rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-blue-gray);
      box-shadow: 0 0 0 3px rgba(114, 123, 156, 0.1);
    }

    .form-input.error {
      border-color: var(--accent-coral);
    }

    .form-input.error:focus {
      box-shadow: 0 0 0 3px rgba(222, 72, 67, 0.1);
    }

    .form-error {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--accent-coral);
      margin-top: 0.25rem;
    }

    .login-btn {
      margin-top: 1rem;
      padding: 0.875rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      position: relative;
    }

    .loading-spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .login-footer {
      margin-top: 2rem;
      text-align: center;
    }

    .demo-notice {
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
      margin: 0;
    }

    .demo-badge {
      display: inline-block;
      background: var(--warning-orange);
      color: var(--white);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 1rem;
      }

      .login-card {
        padding: 2rem;
      }

      .login-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LoginPageComponent {
  private readonly fb = new FormBuilder();
  
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly loginForm: FormGroup<any>;

  constructor(
    private sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      partner: ['', Validators.required],
      userId: ['', Validators.required],
      role: ['', Validators.required]
    });

    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.message.set(params['message']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.loginForm.value as LoginForm;
    const request: LoginRequest = {
      partner: formValue.partner,
      userId: formValue.userId,
      role: formValue.role as any
    };

    try {
      await new Promise<void>((resolve, reject) => {
        this.sessionService.login(request).subscribe({
          next: (response) => {
            console.log('Login successful:', response);
            resolve();
          },
          error: (error) => {
            reject(error);
          }
        });
      });

      // Navigate to return URL or dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    } catch (error: any) {
      console.error('Login error:', error);
      this.error.set(error.userMessage || error.message || 'Login failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}