import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KeysStore } from '../../state/keys.store';
import { GenerateKeyDialogComponent } from './dialogs/generate-key-dialog.component';
import { UploadKeyDialogComponent } from './dialogs/upload-key-dialog.component';
import { RevokeKeyDialogComponent } from './dialogs/revoke-key-dialog.component';

@Component({
  selector: 'app-keys-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="keys-container">
      <div class="keys-header">
        <h1 class="page-title">PGP Keys</h1>
        <p class="page-subtitle">Manage your encryption keys for secure file transfers</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading keys...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button type="button" class="btn-primary" (click)="refresh()">
            Try Again
          </button>
        </div>
      } @else {
        <div class="keys-content">
          <div class="keys-actions">
            <button type="button" class="btn-primary" (click)="openGenerateDialog()">
              Generate New Key
            </button>
            <button type="button" class="btn-secondary" (click)="openUploadDialog()">
              Upload Key
            </button>
          </div>

          @if (keys().length === 0) {
            <div class="empty-state">
              <p>No keys found. Generate or upload your first key to get started.</p>
            </div>
          } @else {
            <div class="keys-list">
              @for (key of keys(); track key.keyId) {
                <div class="key-card" [class.primary]="key.isPrimary">
                  <div class="key-info">
                    <div class="key-header">
                      <span class="key-algorithm">{{ key.algorithm }} {{ key.keySize }}</span>
                      @if (key.isPrimary) {
                        <span class="primary-badge">Primary</span>
                      }
                      <span class="status-badge" [class]="key.status.toLowerCase()">
                        {{ key.status }}
                      </span>
                    </div>
                    <div class="key-fingerprint">{{ key.fingerprint }}</div>
                    <div class="key-dates">
                      Created: {{ formatDate(key.createdAt) }}
                      @if (key.validTo) {
                        • Expires: {{ formatDate(key.validTo) }}
                      }
                    </div>
                  </div>
                  <div class="key-actions">
                    @if (key.status === 'Active' && !key.isPrimary) {
                      <button type="button" class="btn-secondary btn-sm" (click)="promoteKey(key.keyId)">
                        Make Primary
                      </button>
                    }
                    @if (key.status === 'Active') {
                      <button type="button" class="btn-danger btn-sm" (click)="openRevokeDialog(key)">
                        Revoke
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .keys-container {
      max-width: 100%;
    }

    .keys-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-family: var(--font-heading);
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      font-family: var(--font-body);
      font-size: 1.125rem;
      color: var(--primary-blue-gray);
      margin: 0;
    }

    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .loading-spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid var(--light-gray);
      border-top: 3px solid var(--primary-blue-gray);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .keys-content {
      background: var(--white);
      border-radius: 0.5rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      padding: 2rem;
    }

    .keys-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .keys-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .keys-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .key-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border: 1px solid #E9ECEF;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }

    .key-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .key-card.primary {
      border-color: var(--primary-blue-gray);
      background: rgba(114, 123, 156, 0.02);
    }

    .key-info {
      flex: 1;
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

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-badge.active {
      background: rgba(40, 167, 69, 0.1);
      color: var(--success-green);
    }

    .status-badge.revoked {
      background: rgba(222, 72, 67, 0.1);
      color: var(--accent-coral);
    }

    .status-badge.expired {
      background: rgba(255, 193, 7, 0.1);
      color: var(--warning-orange);
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

    .key-actions {
      display: flex;
      gap: 0.5rem;
    }

    .key-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 2rem;
      }

      .keys-actions {
        flex-direction: column;
      }

      .key-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .key-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class KeysPageComponent implements OnInit, OnDestroy {
  constructor(
    private keysStore: KeysStore,
    private dialog: MatDialog
  ) {}

  get loading() {
    return this.keysStore.loading;
  }

  get error() {
    return this.keysStore.error;
  }

  get keys() {
    return this.keysStore.keys;
  }

  async ngOnInit(): Promise<void> {
    await this.keysStore.load();
  }

  ngOnDestroy(): void {
    // Optional cleanup if needed
  }

  async refresh(): Promise<void> {
    await this.keysStore.refresh();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  openGenerateDialog(): void {
    const dialogRef = this.dialog.open(GenerateKeyDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Key was generated successfully
        console.log('Key generated successfully');
      }
    });
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadKeyDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Key uploaded successfully:', result.key);
      }
    });
  }

  openRevokeDialog(key: any): void {
    const dialogRef = this.dialog.open(RevokeKeyDialogComponent, {
      width: '600px',
      disableClose: true,
      data: key
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Key revoked successfully:', result.keyId);
      }
    });
  }

  async promoteKey(keyId: string): Promise<void> {
    try {
      await this.keysStore.promote(keyId);
      console.log('Key promoted successfully');
    } catch (error) {
      console.error('Error promoting key:', error);
    }
  }
}