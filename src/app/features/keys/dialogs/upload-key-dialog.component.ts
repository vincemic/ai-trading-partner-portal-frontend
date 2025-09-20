import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KeysStore } from '../../../state/keys.store';
import { UploadKeyRequest, KeySummaryDto } from '../../../core/models/dto.models';

@Component({
  selector: 'app-upload-key-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Upload PGP Public Key</h2>
      
      <div mat-dialog-content>
        <form [formGroup]="form" class="upload-form">
          <!-- File Upload Section -->
          <div class="upload-section">
            <div class="upload-options">
              <input 
                type="file" 
                #fileInput 
                (change)="onFileSelected($event)"
                accept=".asc,.txt,.pub,.pem"
                style="display: none;">
              
              <button 
                type="button" 
                mat-raised-button 
                (click)="fileInput.click()"
                class="upload-button">
                <mat-icon>upload_file</mat-icon>
                Select File
              </button>
              
              <span class="upload-info">
                Supports: .asc, .txt, .pub, .pem files
              </span>
            </div>

            <div class="divider">
              <span>OR</span>
            </div>
          </div>

          <!-- Text Input Section -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>ASCII-Armored Public Key</mat-label>
            <textarea 
              matInput 
              formControlName="publicKeyArmored"
              rows="10"
              placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----
...
-----END PGP PUBLIC KEY BLOCK-----"
              class="key-textarea">
            </textarea>
            @if (form.get('publicKeyArmored')?.hasError('required')) {
              <mat-error>Public key is required</mat-error>
            }
            @if (form.get('publicKeyArmored')?.hasError('invalidPgpFormat')) {
              <mat-error>Invalid PGP public key format</mat-error>
            }
          </mat-form-field>

          <!-- Key Preview Section -->
          @if (keyPreview()) {
            <div class="key-preview">
              <h4>Key Preview</h4>
              <div class="preview-info">
                <p><strong>Format:</strong> Valid PGP Public Key</p>
                @if (estimatedKeySize()) {
                  <p><strong>Estimated Size:</strong> ~{{ estimatedKeySize() }} bits</p>
                }
              </div>
            </div>
          }

          <!-- Configuration Section -->
          <div class="config-section">
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

            <mat-checkbox formControlName="makePrimary" class="make-primary-checkbox">
              Make this the primary key
            </mat-checkbox>
          </div>

          <div class="info-panel">
            <mat-icon>info</mat-icon>
            <div class="info-content">
              <p><strong>Upload Requirements:</strong></p>
              <ul>
                <li>Only public keys are accepted (private keys will be rejected)</li>
                <li>Key must be in ASCII-armored format</li>
                <li>RSA keys with 2048+ bits are recommended</li>
                <li>Ensure the key is not expired or revoked</li>
              </ul>
            </div>
          </div>
        </form>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onUpload()" 
          [disabled]="form.invalid || loading()">
          <mat-icon>cloud_upload</mat-icon>
          Upload Key
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
      max-width: 700px;
    }

    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .full-width {
      width: 100%;
    }

    .upload-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .upload-options {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .upload-button {
      flex-shrink: 0;
    }

    .upload-info {
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1rem 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #E9ECEF;
    }

    .divider span {
      padding: 0 1rem;
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
      background: var(--white);
    }

    .key-textarea {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      line-height: 1.3;
    }

    .key-preview {
      padding: 1rem;
      background: rgba(40, 167, 69, 0.1);
      border-radius: 0.5rem;
      border-left: 4px solid var(--success-green);
    }

    .key-preview h4 {
      margin: 0 0 0.75rem 0;
      color: var(--success-green);
      font-size: 1rem;
    }

    .preview-info p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .config-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .make-primary-checkbox {
      margin: 0.5rem 0;
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

      .upload-options {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class UploadKeyDialogComponent {
  private readonly fb = new FormBuilder();
  private readonly _loading = signal(false);
  private readonly _keyPreview = signal(false);
  private readonly _estimatedKeySize = signal<number | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly keyPreview = this._keyPreview.asReadonly();
  readonly estimatedKeySize = this._estimatedKeySize.asReadonly();

  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<UploadKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private keysStore: KeysStore
  ) {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    
    this.form = this.fb.group({
      publicKeyArmored: ['', [Validators.required, this.pgpPublicKeyValidator]],
      validFrom: [today, Validators.required],
      validTo: [''],
      makePrimary: [false]
    }, { validators: this.dateRangeValidator });

    // Watch for changes in public key to show preview
    this.form.get('publicKeyArmored')?.valueChanges.subscribe(value => {
      this.updateKeyPreview(value);
    });
  }

  private pgpPublicKeyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const pgpPattern = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*-----END PGP PUBLIC KEY BLOCK-----/;
    return pgpPattern.test(value) ? null : { invalidPgpFormat: true };
  }

  private dateRangeValidator(control: any) {
    const validFrom = control.get('validFrom')?.value;
    const validTo = control.get('validTo')?.value;

    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      return { dateRange: true };
    }

    return null;
  }

  private updateKeyPreview(keyData: string): void {
    if (!keyData) {
      this._keyPreview.set(false);
      this._estimatedKeySize.set(null);
      return;
    }

    const pgpPattern = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*-----END PGP PUBLIC KEY BLOCK-----/;
    if (pgpPattern.test(keyData)) {
      this._keyPreview.set(true);
      
      // Rough estimation of key size based on data length
      // This is a very rough approximation
      const dataLength = keyData.replace(/\s/g, '').length;
      if (dataLength > 3000) {
        this._estimatedKeySize.set(4096);
      } else if (dataLength > 2000) {
        this._estimatedKeySize.set(2048);
      } else {
        this._estimatedKeySize.set(null);
      }
    } else {
      this._keyPreview.set(false);
      this._estimatedKeySize.set(null);
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.form.patchValue({ publicKeyArmored: content });
    };
    reader.readAsText(file);
  }

  async onUpload(): Promise<void> {
    if (this.form.invalid) return;

    this._loading.set(true);
    
    try {
      const formValue = this.form.value;
      const request: UploadKeyRequest = {
        publicKeyArmored: formValue.publicKeyArmored,
        validFrom: formValue.validFrom,
        validTo: formValue.validTo || undefined,
        makePrimary: formValue.makePrimary
      };

      const uploadedKey: KeySummaryDto = await this.keysStore.upload(request);
      
      this.dialogRef.close({
        success: true,
        key: uploadedKey
      });
      
    } catch (error) {
      console.error('Error uploading key:', error);
      // TODO: Show error toast
    } finally {
      this._loading.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}