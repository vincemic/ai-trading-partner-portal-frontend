import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KeysStore } from '../../../state/keys.store';
import { RevokeKeyRequest, KeySummaryDto } from '../../../core/models/dto.models';

@Component({
  selector: 'app-revoke-key-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        Revoke PGP Key
      </h2>
      
      <div mat-dialog-content>
        <!-- Key Information -->
        <div class="key-info-section">
          <h3>Key to be Revoked:</h3>
          <div class="key-details">
            <div class="key-header">
              <span class="key-algorithm">{{ keyData.algorithm }} {{ keyData.keySize }}</span>
              @if (keyData.isPrimary) {
                <span class="primary-badge">Primary Key</span>
              }
            </div>
            <div class="key-fingerprint">{{ keyData.fingerprint }}</div>
            <div class="key-dates">
              Created: {{ formatDate(keyData.createdAt) }}
              @if (keyData.validTo) {
                • Expires: {{ formatDate(keyData.validTo) }}
              }
            </div>
          </div>
        </div>

        <!-- Warning Section -->
        <div class="warning-section">
          <div class="warning-panel critical">
            <mat-icon color="warn">error</mat-icon>
            <div>
              <h4>Critical Warning</h4>
              <p><strong>This action cannot be undone.</strong> Once revoked, this key will:</p>
              <ul>
                <li>Immediately stop working for encryption/decryption</li>
                <li>Become permanently unusable for all operations</li>
                <li>Be marked as revoked in the system</li>
              </ul>
            </div>
          </div>

          @if (keyData.isPrimary) {
            <div class="warning-panel impact">
              <mat-icon color="warn">info</mat-icon>
              <div>
                <h4>Primary Key Impact</h4>
                <p>This is your <strong>primary key</strong>. Revoking it will:</p>
                <ul>
                  <li>Affect all active file transfers using this key</li>
                  <li>Require immediate setup of a new primary key</li>
                  <li>May disrupt ongoing EDI operations</li>
                </ul>
                <p><strong>Recommendation:</strong> Upload or generate a new key and make it primary before revoking this one.</p>
              </div>
            </div>
          }
        </div>

        <!-- Revocation Form -->
        <form [formGroup]="form" class="revoke-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Reason for Revocation (Optional)</mat-label>
            <textarea 
              matInput 
              formControlName="reason"
              rows="3"
              placeholder="e.g., Key compromised, replacing with new key, no longer needed">
            </textarea>
            <mat-hint>This reason will be logged for audit purposes</mat-hint>
          </mat-form-field>
        </form>

        <!-- Confirmation Section -->
        <div class="confirmation-section">
          <div class="confirmation-text">
            <p>To confirm revocation, please type the key algorithm and size below:</p>
            <p><strong>Expected:</strong> {{ keyData.algorithm }} {{ keyData.keySize }}</p>
          </div>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmation</mat-label>
            <input 
              matInput 
              [(ngModel)]="confirmationText"
              [placeholder]="expectedConfirmation"
              class="confirmation-input">
            @if (confirmationText && !isConfirmationValid()) {
              <mat-error>Confirmation text doesn't match</mat-error>
            }
          </mat-form-field>
        </div>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button 
          mat-raised-button 
          color="warn" 
          (click)="onRevoke()" 
          [disabled]="!canRevoke() || loading()">
          Revoke Key
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
      max-width: 600px;
    }

    .key-info-section {
      margin-bottom: 1.5rem;
    }

    .key-info-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: var(--primary-navy);
    }

    .key-details {
      padding: 1rem;
      border: 1px solid #E9ECEF;
      border-radius: 0.5rem;
      background: var(--light-gray);
    }

    .key-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .key-algorithm {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--dark-gray);
    }

    .primary-badge {
      background: var(--primary-blue-gray);
      color: var(--white);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .key-fingerprint {
      font-family: var(--font-mono);
      font-size: 0.875rem;
      color: var(--medium-gray);
      margin-bottom: 0.5rem;
      word-break: break-all;
    }

    .key-dates {
      font-family: var(--font-ui);
      font-size: 0.75rem;
      color: var(--primary-blue-gray);
    }

    .warning-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .warning-panel {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .warning-panel.critical {
      background: rgba(222, 72, 67, 0.1);
      border-left: 4px solid var(--accent-coral);
    }

    .warning-panel.impact {
      background: rgba(255, 193, 7, 0.1);
      border-left: 4px solid var(--warning-orange);
    }

    .warning-panel h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .warning-panel.critical h4 {
      color: var(--accent-coral);
    }

    .warning-panel.impact h4 {
      color: var(--warning-orange);
    }

    .warning-panel p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .warning-panel ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
      font-size: 0.875rem;
    }

    .revoke-form {
      margin-bottom: 1.5rem;
    }

    .full-width {
      width: 100%;
    }

    .confirmation-section {
      padding: 1rem;
      background: rgba(222, 72, 67, 0.05);
      border-radius: 0.5rem;
      border: 1px solid rgba(222, 72, 67, 0.2);
    }

    .confirmation-text {
      margin-bottom: 1rem;
    }

    .confirmation-text p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .confirmation-input {
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
export class RevokeKeyDialogComponent {
  private readonly fb = new FormBuilder();
  private readonly _loading = signal(false);

  readonly loading = this._loading.asReadonly();

  form: FormGroup;
  confirmationText = '';
  expectedConfirmation: string;

  constructor(
    private dialogRef: MatDialogRef<RevokeKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public keyData: KeySummaryDto,
    private keysStore: KeysStore
  ) {
    this.form = this.fb.group({
      reason: ['']
    });

    this.expectedConfirmation = `${this.keyData.algorithm} ${this.keyData.keySize}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  isConfirmationValid(): boolean {
    return this.confirmationText.trim().toLowerCase() === this.expectedConfirmation.toLowerCase();
  }

  canRevoke(): boolean {
    return this.isConfirmationValid();
  }

  async onRevoke(): Promise<void> {
    if (!this.canRevoke()) return;

    this._loading.set(true);
    
    try {
      const formValue = this.form.value;
      const request: RevokeKeyRequest = {
        reason: formValue.reason || undefined
      };

      await this.keysStore.revoke(this.keyData.keyId, request);
      
      this.dialogRef.close({
        success: true,
        keyId: this.keyData.keyId,
        reason: request.reason
      });
      
    } catch (error) {
      console.error('Error revoking key:', error);
      // TODO: Show error toast
    } finally {
      this._loading.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}