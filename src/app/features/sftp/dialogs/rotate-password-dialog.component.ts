import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SftpStore } from '../../../state/sftp.store';
import { RotatePasswordRequest, RotatePasswordResponse } from '../../../core/models/dto.models';

interface PasswordComplexity {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
  score: number;
}

@Component({
  selector: 'app-rotate-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatProgressBarModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Rotate SFTP Password</h2>
      
      <div mat-dialog-content>
        <form [formGroup]="form" class="rotate-form">
          <!-- Mode Selection -->
          <div class="mode-selection">
            <h3>Password Generation Mode</h3>
            <mat-radio-group formControlName="mode" class="mode-options">
              <mat-radio-button value="auto" class="mode-option">
                <div class="mode-content">
                  <div class="mode-title">Auto-Generate (Recommended)</div>
                  <div class="mode-description">
                    Generate a secure 32-character password with mixed case, numbers, and symbols
                  </div>
                </div>
              </mat-radio-button>
              
              <mat-radio-button value="manual" class="mode-option">
                <div class="mode-content">
                  <div class="mode-title">Manual Entry</div>
                  <div class="mode-description">
                    Enter your own password (must meet complexity requirements)
                  </div>
                </div>
              </mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Manual Password Entry -->
          @if (form.get('mode')?.value === 'manual') {
            <div class="manual-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input 
                  matInput 
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="newPassword"
                  autocomplete="new-password">
                <button 
                  mat-icon-button 
                  matSuffix 
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="showPassword()">
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('newPassword')?.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (form.get('newPassword')?.hasError('minlength')) {
                  <mat-error>Password must be at least 24 characters</mat-error>
                }
                @if (form.get('newPassword')?.hasError('complexity')) {
                  <mat-error>Password does not meet complexity requirements</mat-error>
                }
              </mat-form-field>

              <!-- Password Strength Indicator -->
              @if (form.get('newPassword')?.value) {
                <div class="strength-indicator">
                  <div class="strength-header">
                    <span>Password Strength</span>
                    <span class="strength-score" [class]="getStrengthClass()">
                      {{ getStrengthLabel() }}
                    </span>
                  </div>
                  <div class="strength-bar">
                    <div 
                      class="strength-fill" 
                      [class]="getStrengthClass()"
                      [style.width.%]="(passwordComplexity().score / 5) * 100">
                    </div>
                  </div>
                  <div class="requirements-list">
                    <div class="requirement" [class.met]="passwordComplexity().length">
                      <mat-icon>{{ passwordComplexity().length ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      At least 24 characters
                    </div>
                    <div class="requirement" [class.met]="passwordComplexity().uppercase">
                      <mat-icon>{{ passwordComplexity().uppercase ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      Uppercase letters (A-Z)
                    </div>
                    <div class="requirement" [class.met]="passwordComplexity().lowercase">
                      <mat-icon>{{ passwordComplexity().lowercase ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      Lowercase letters (a-z)
                    </div>
                    <div class="requirement" [class.met]="passwordComplexity().numbers">
                      <mat-icon>{{ passwordComplexity().numbers ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      Numbers (0-9)
                    </div>
                    <div class="requirement" [class.met]="passwordComplexity().special">
                      <mat-icon>{{ passwordComplexity().special ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      Special characters (!@#$%^&*)
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Generated Password Display -->
          @if (showGeneratedPassword()) {
            <div class="generated-password-section">
              <div class="security-warning">
                <mat-icon color="warn">warning</mat-icon>
                <div>
                  <h4>Important Security Notice</h4>
                  <p>This password will only be shown once and cannot be recovered.</p>
                  <p>Copy it to a secure location immediately.</p>
                </div>
              </div>

              <div class="password-container">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Generated Password</mat-label>
                  <input 
                    matInput 
                    readonly 
                    [value]="generatedPassword()"
                    class="generated-password-input">
                  <button 
                    mat-icon-button 
                    matSuffix 
                    type="button"
                    (click)="copyToClipboard()"
                    [disabled]="copySuccess()">
                    <mat-icon>{{ copySuccess() ? 'check' : 'content_copy' }}</mat-icon>
                  </button>
                </mat-form-field>
                
                <div class="copy-actions">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    (click)="copyToClipboard()"
                    [disabled]="copySuccess()">
                    <mat-icon>{{ copySuccess() ? 'check' : 'content_copy' }}</mat-icon>
                    {{ copySuccess() ? 'Copied!' : 'Copy to Clipboard' }}
                  </button>
                </div>
              </div>

              <div class="rotation-info">
                <h4>Password Rotation Completed</h4>
                <p><strong>Rotation Method:</strong> Auto-generated</p>
                <p><strong>Timestamp:</strong> {{ formatDate(rotationTimestamp()) }}</p>
                <p><strong>Password Length:</strong> {{ generatedPassword()?.length }} characters</p>
              </div>
            </div>
          }

          <!-- Security Best Practices -->
          @if (!showGeneratedPassword()) {
            <div class="info-panel">
              <mat-icon>security</mat-icon>
              <div class="info-content">
                <p><strong>Security Best Practices:</strong></p>
                <ul>
                  <li>Use auto-generation for maximum security</li>
                  <li>Store passwords in a secure password manager</li>
                  <li>Never share passwords via insecure channels</li>
                  <li>Rotate passwords regularly (quarterly recommended)</li>
                </ul>
              </div>
            </div>
          }
        </form>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </div>

      <div mat-dialog-actions align="end">
        @if (!showGeneratedPassword()) {
          <button mat-button (click)="onCancel()">Cancel</button>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="onRotate()" 
            [disabled]="!canRotate() || loading()">
            <mat-icon>sync</mat-icon>
            Rotate Password
          </button>
        } @else {
          <button mat-button (click)="onCancel()">Close</button>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="onComplete()"
            [disabled]="!copySuccess()">
            I've Saved the Password
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
      max-width: 700px;
    }

    .rotate-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .mode-selection h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: var(--primary-navy);
    }

    .mode-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mode-option {
      padding: 1rem;
      border: 1px solid #E9ECEF;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }

    .mode-option:hover {
      border-color: var(--primary-blue-gray);
      background: rgba(114, 123, 156, 0.02);
    }

    .mode-content {
      margin-left: 2rem;
    }

    .mode-title {
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.25rem;
    }

    .mode-description {
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
    }

    .manual-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .strength-indicator {
      background: var(--light-gray);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .strength-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .strength-score.weak { color: var(--accent-coral); }
    .strength-score.fair { color: var(--warning-orange); }
    .strength-score.good { color: #17A2B8; }
    .strength-score.strong { color: var(--success-green); }

    .strength-bar {
      height: 4px;
      background: #E9ECEF;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .strength-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .strength-fill.weak { background: var(--accent-coral); }
    .strength-fill.fair { background: var(--warning-orange); }
    .strength-fill.good { background: #17A2B8; }
    .strength-fill.strong { background: var(--success-green); }

    .requirements-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--medium-gray);
    }

    .requirement.met {
      color: var(--success-green);
    }

    .requirement mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .generated-password-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .security-warning {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(222, 72, 67, 0.1);
      border-radius: 0.5rem;
      border-left: 4px solid var(--accent-coral);
    }

    .security-warning h4 {
      margin: 0 0 0.5rem 0;
      color: var(--accent-coral);
      font-size: 1rem;
    }

    .security-warning p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .password-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .generated-password-input {
      font-family: var(--font-mono);
      font-size: 0.875rem;
      letter-spacing: 0.05em;
    }

    .copy-actions {
      display: flex;
      justify-content: center;
    }

    .rotation-info {
      padding: 1rem;
      background: rgba(40, 167, 69, 0.1);
      border-radius: 0.5rem;
      border-left: 4px solid var(--success-green);
    }

    .rotation-info h4 {
      margin: 0 0 0.75rem 0;
      color: var(--success-green);
      font-size: 1rem;
    }

    .rotation-info p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .info-panel {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(114, 123, 156, 0.1);
      border-radius: 0.5rem;
      border-left: 4px solid var(--primary-blue-gray);
    }

    .info-content p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .info-content ul {
      margin: 0;
      padding-left: 1.5rem;
      font-size: 0.875rem;
    }

    mat-dialog-actions {
      margin-top: 1.5rem;
      gap: 1rem;
    }

    mat-progress-bar {
      margin-top: 1rem;
    }

    @media (max-width: 600px) {
      .dialog-container {
        min-width: auto;
        width: 95vw;
      }

      .mode-options {
        gap: 0.5rem;
      }

      .mode-content {
        margin-left: 1.5rem;
      }
    }
  `]
})
export class RotatePasswordDialogComponent {
  private readonly fb = new FormBuilder();
  private readonly _loading = signal(false);
  private readonly _showPassword = signal(false);
  private readonly _generatedPassword = signal<string | null>(null);
  private readonly _copySuccess = signal(false);
  private readonly _rotationTimestamp = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly showPassword = this._showPassword.asReadonly();
  readonly generatedPassword = this._generatedPassword.asReadonly();
  readonly copySuccess = this._copySuccess.asReadonly();
  readonly rotationTimestamp = this._rotationTimestamp.asReadonly();
  readonly showGeneratedPassword = computed(() => !!this._generatedPassword());

  form: FormGroup;

  readonly passwordComplexity = computed(() => this.calculatePasswordComplexity());

  constructor(
    private dialogRef: MatDialogRef<RotatePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sftpStore: SftpStore
  ) {
    this.form = this.fb.group({
      mode: ['auto', Validators.required],
      newPassword: ['']
    });

    // Add conditional validators based on mode
    this.form.get('mode')?.valueChanges.subscribe(mode => {
      const passwordControl = this.form.get('newPassword');
      
      if (mode === 'manual') {
        passwordControl?.setValidators([
          Validators.required,
          Validators.minLength(24),
          this.passwordComplexityValidator
        ]);
      } else {
        passwordControl?.clearValidators();
      }
      
      passwordControl?.updateValueAndValidity();
    });
  }

  private passwordComplexityValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const complexity = this.calculatePasswordComplexity(value);
    return complexity.score >= 5 ? null : { complexity: true };
  };

  private calculatePasswordComplexity(password?: string): PasswordComplexity {
    const pwd = password || this.form.get('newPassword')?.value || '';
    
    const complexity: PasswordComplexity = {
      length: pwd.length >= 24,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(pwd),
      score: 0
    };

    // Calculate score
    if (complexity.length) complexity.score++;
    if (complexity.uppercase) complexity.score++;
    if (complexity.lowercase) complexity.score++;
    if (complexity.numbers) complexity.score++;
    if (complexity.special) complexity.score++;

    return complexity;
  }

  getStrengthClass(): string {
    const score = this.passwordComplexity().score;
    if (score < 2) return 'weak';
    if (score < 4) return 'fair';
    if (score < 5) return 'good';
    return 'strong';
  }

  getStrengthLabel(): string {
    const score = this.passwordComplexity().score;
    if (score < 2) return 'Weak';
    if (score < 4) return 'Fair';
    if (score < 5) return 'Good';
    return 'Strong';
  }

  canRotate(): boolean {
    return this.form.valid;
  }

  togglePasswordVisibility(): void {
    this._showPassword.update(show => !show);
  }

  async onRotate(): Promise<void> {
    if (!this.canRotate()) return;

    this._loading.set(true);
    
    try {
      const formValue = this.form.value;
      const request: RotatePasswordRequest = {
        mode: formValue.mode,
        newPassword: formValue.mode === 'manual' ? formValue.newPassword : undefined
      };

      const response: RotatePasswordResponse = await this.sftpStore.rotate(request);
      
      if (response.password) {
        this._generatedPassword.set(response.password);
        this._rotationTimestamp.set(new Date().toISOString());
        
        // Auto-clear after 5 minutes
        setTimeout(() => this.clearPassword(), 5 * 60 * 1000);
      } else {
        // Manual mode - close immediately
        this.dialogRef.close({
          success: true,
          mode: 'manual'
        });
      }
      
    } catch (error) {
      console.error('Error rotating password:', error);
      // TODO: Show error toast
    } finally {
      this._loading.set(false);
    }
  }

  async copyToClipboard(): Promise<void> {
    const password = this._generatedPassword();
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      this._copySuccess.set(true);
      
      // Reset copy success after 3 seconds
      setTimeout(() => this._copySuccess.set(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(password);
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this._copySuccess.set(true);
      setTimeout(() => this._copySuccess.set(false), 3000);
    } catch (err) {
      console.error('Fallback: Unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

  onCancel(): void {
    this.clearPassword();
    this.dialogRef.close(false);
  }

  onComplete(): void {
    this.clearPassword();
    this.dialogRef.close({
      success: true,
      mode: 'auto'
    });
  }

  formatDate(dateString: string | null): string {
    return dateString ? new Date(dateString).toLocaleString() : '';
  }

  private clearPassword(): void {
    this._generatedPassword.set(null);
    this._copySuccess.set(false);
    this._rotationTimestamp.set(null);
    this.sftpStore.clearLastGeneratedPassword();
  }
}