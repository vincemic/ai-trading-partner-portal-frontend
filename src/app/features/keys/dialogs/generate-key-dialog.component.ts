import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KeysStore } from '../../../state/keys.store';
import { GenerateKeyRequest, GenerateKeyResponse } from '../../../core/models/dto.models';

@Component({
  selector: 'app-generate-key-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Generate New PGP Key</h2>
      
      <div mat-dialog-content>
        @if (!showPrivateKey()) {
          <!-- Key Generation Form -->
          <form [formGroup]="form" class="generate-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Valid From</mat-label>
              <input matInput type="date" formControlName="validFrom" required>
              <mat-error>Valid from date is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Valid To (Optional)</mat-label>
              <input matInput type="date" formControlName="validTo">
              @if (form.hasError('dateRange')) {
                <mat-error>Valid to must be after valid from date</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Key Size</mat-label>
              <mat-select formControlName="keySize">
                <mat-option [value]="2048">2048 bits</mat-option>
                <mat-option [value]="4096">4096 bits (Recommended)</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-checkbox formControlName="makePrimary" class="make-primary-checkbox">
              Make this the primary key
            </mat-checkbox>

            <div class="info-panel">
              <mat-icon>info</mat-icon>
              <div class="info-content">
                <p><strong>Key Generation Process:</strong></p>
                <ul>
                  <li>A new RSA key pair will be generated</li>
                  <li>The private key will be displayed only once</li>
                  <li>Store your private key securely - it cannot be recovered</li>
                </ul>
              </div>
            </div>
          </form>
        } @else {
          <!-- Private Key Display -->
          <div class="private-key-section">
            <div class="security-warning">
              <mat-icon color="warn">warning</mat-icon>
              <div>
                <h3>Important Security Notice</h3>
                <p>This is your private key. It will only be shown once and cannot be recovered.</p>
                <p>Copy it to a secure location immediately.</p>
              </div>
            </div>

            <div class="private-key-container">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Private Key (PEM Format)</mat-label>
                <textarea 
                  matInput 
                  readonly 
                  rows="12" 
                  [value]="privateKey()"
                  class="private-key-textarea">
                </textarea>
              </mat-form-field>
              
              <div class="key-actions">
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

            <div class="key-info">
              <h4>Key Generated Successfully</h4>
              <p><strong>Algorithm:</strong> {{ generatedKey()?.algorithm }} {{ generatedKey()?.keySize }}</p>
              <p><strong>Fingerprint:</strong> {{ generatedKey()?.fingerprint }}</p>
              <p><strong>Key ID:</strong> {{ generatedKey()?.keyId }}</p>
            </div>
          </div>
        }

        @if (loading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </div>

      <div mat-dialog-actions align="end">
        @if (!showPrivateKey()) {
          <button mat-button (click)="onCancel()">Cancel</button>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="onGenerate()" 
            [disabled]="form.invalid || loading()">
            <mat-icon>vpn_key</mat-icon>
            Generate Key
          </button>
        } @else {
          <button mat-button (click)="onCancel()">Close</button>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="onComplete()"
            [disabled]="!copySuccess()">
            I've Saved the Private Key
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

    .generate-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .make-primary-checkbox {
      margin: 1rem 0;
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

    .private-key-section {
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

    .security-warning h3 {
      margin: 0 0 0.5rem 0;
      color: var(--accent-coral);
      font-size: 1rem;
    }

    .security-warning p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .private-key-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .private-key-textarea {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      line-height: 1.2;
    }

    .key-actions {
      display: flex;
      justify-content: center;
    }

    .key-info {
      padding: 1rem;
      background: rgba(40, 167, 69, 0.1);
      border-radius: 0.5rem;
      border-left: 4px solid var(--success-green);
    }

    .key-info h4 {
      margin: 0 0 0.75rem 0;
      color: var(--success-green);
      font-size: 1rem;
    }

    .key-info p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      font-family: var(--font-mono);
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
    }
  `]
})
export class GenerateKeyDialogComponent {
  private readonly fb = new FormBuilder();
  private readonly _loading = signal(false);
  private readonly _privateKey = signal<string | null>(null);
  private readonly _generatedKey = signal<any | null>(null);
  private readonly _copySuccess = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly privateKey = this._privateKey.asReadonly();
  readonly generatedKey = this._generatedKey.asReadonly();
  readonly copySuccess = this._copySuccess.asReadonly();
  readonly showPrivateKey = computed(() => !!this._privateKey());

  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<GenerateKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private keysStore: KeysStore
  ) {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    
    this.form = this.fb.group({
      validFrom: [today, Validators.required],
      validTo: [''],
      keySize: [4096, [Validators.required, Validators.min(2048)]],
      makePrimary: [false]
    }, { validators: this.dateRangeValidator });
  }

  private dateRangeValidator(control: any) {
    const validFrom = control.get('validFrom')?.value;
    const validTo = control.get('validTo')?.value;

    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      return { dateRange: true };
    }

    return null;
  }

  async onGenerate(): Promise<void> {
    if (this.form.invalid) return;

    this._loading.set(true);
    
    try {
      const formValue = this.form.value;
      const request: GenerateKeyRequest = {
        validFrom: formValue.validFrom,
        validTo: formValue.validTo || undefined,
        makePrimary: formValue.makePrimary
      };

      const response: GenerateKeyResponse = await this.keysStore.generate(request);
      
      this._privateKey.set(response.privateKeyArmored);
      this._generatedKey.set(response.key);
      
      // Auto-clear private key after 10 minutes
      setTimeout(() => this.clearPrivateKey(), 10 * 60 * 1000);
      
    } catch (error) {
      console.error('Error generating key:', error);
      // TODO: Show error toast
    } finally {
      this._loading.set(false);
    }
  }

  async copyToClipboard(): Promise<void> {
    const privateKey = this._privateKey();
    if (!privateKey) return;

    try {
      await navigator.clipboard.writeText(privateKey);
      this._copySuccess.set(true);
      
      // Reset copy success after 3 seconds
      setTimeout(() => this._copySuccess.set(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(privateKey);
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
    this.clearPrivateKey();
    this.dialogRef.close(false);
  }

  onComplete(): void {
    this.clearPrivateKey();
    this.dialogRef.close(true);
  }

  private clearPrivateKey(): void {
    this._privateKey.set(null);
    this._generatedKey.set(null);
    this._copySuccess.set(false);
    this.keysStore.clearLastGeneratedPrivateKey();
  }
}