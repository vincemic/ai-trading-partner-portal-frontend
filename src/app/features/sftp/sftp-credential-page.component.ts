import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SftpStore } from '../../state/sftp.store';
import { RotatePasswordDialogComponent } from './dialogs/rotate-password-dialog.component';

@Component({
  selector: 'app-sftp-credential-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="sftp-container">
      <div class="sftp-header">
        <h1 class="page-title">SFTP Credentials</h1>
        <p class="page-subtitle">Manage your SFTP connection credentials</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading SFTP credentials...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button type="button" class="btn-primary" (click)="refresh()">
            Try Again
          </button>
        </div>
      } @else {
        <div class="sftp-content">
          <div class="credential-card">
            <h3>Password Management</h3>
            <div class="credential-info">
              @if (metadata()?.lastRotatedAt) {
                <p><strong>Last Rotated:</strong> {{ formatDate(metadata()!.lastRotatedAt!) }}</p>
                <p><strong>Method:</strong> {{ metadata()?.rotationMethod || 'Unknown' }}</p>
              } @else {
                <p>No password rotation history available.</p>
              }
            </div>
            <div class="credential-actions">
              <button type="button" class="btn-primary" (click)="openRotateDialog()">
                Rotate Password
              </button>
            </div>
          </div>

          <div class="info-card">
            <h3>Connection Information</h3>
            <p class="info-text">
              SFTP connection details and endpoint management will be available in future releases.
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sftp-container {
      max-width: 100%;
    }

    .sftp-header {
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

    .loading-state, .error-state {
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

    .sftp-content {
      display: grid;
      gap: 2rem;
      grid-template-columns: 1fr;
    }

    .credential-card, .info-card {
      background: var(--white);
      border-radius: 0.5rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      padding: 2rem;
    }

    .credential-card h3, .info-card h3 {
      font-family: var(--font-heading);
      font-size: 1.375rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin: 0 0 1.5rem 0;
    }

    .credential-info {
      margin-bottom: 2rem;
    }

    .credential-info p {
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--medium-gray);
      margin: 0 0 0.5rem 0;
    }

    .credential-info strong {
      color: var(--dark-gray);
    }

    .credential-actions {
      display: flex;
      gap: 1rem;
    }

    .credential-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .info-text {
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--medium-gray);
      margin: 0;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 2rem;
      }

      .credential-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SftpCredentialPageComponent implements OnInit, OnDestroy {
  constructor(
    private sftpStore: SftpStore,
    private dialog: MatDialog
  ) {}

  get loading() {
    return this.sftpStore.loading;
  }

  get error() {
    return this.sftpStore.error;
  }

  get metadata() {
    return this.sftpStore.metadata;
  }

  async ngOnInit(): Promise<void> {
    await this.sftpStore.load();
  }

  ngOnDestroy(): void {
    // Optional cleanup if needed
  }

  async refresh(): Promise<void> {
    await this.sftpStore.refresh();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  openRotateDialog(): void {
    const dialogRef = this.dialog.open(RotatePasswordDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Password rotated successfully:', result.mode);
        // Refresh metadata to show updated last rotation time
        this.refresh();
      }
    });
  }
}