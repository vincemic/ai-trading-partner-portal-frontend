import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesStore } from '../../state/files.store';

@Component({
  selector: 'app-files-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="files-container">
      <div class="files-header">
        <h1 class="page-title">Files</h1>
        <p class="page-subtitle">Browse and monitor your EDI file transfers</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading files...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button type="button" class="btn-primary" (click)="refresh()">
            Try Again
          </button>
        </div>
      } @else {
        <div class="files-content">
          <div class="files-filters">
            <p>Filters and search functionality will be implemented in future iterations.</p>
          </div>

          @if (!hasFiles()) {
            <div class="empty-state">
              <p>No files found. Files will appear here once transfers begin.</p>
            </div>
          } @else {
            <div class="files-table">
              <div class="table-header">
                <div class="header-cell">File ID</div>
                <div class="header-cell">Direction</div>
                <div class="header-cell">Type</div>
                <div class="header-cell">Size</div>
                <div class="header-cell">Status</div>
                <div class="header-cell">Received</div>
              </div>
              @for (file of files()?.items || []; track file.fileId) {
                <div class="table-row">
                  <div class="table-cell">{{ file.fileId.substring(0, 8) }}...</div>
                  <div class="table-cell">
                    <span class="direction-badge" [class]="file.direction.toLowerCase()">
                      {{ file.direction }}
                    </span>
                  </div>
                  <div class="table-cell">{{ file.docType }}</div>
                  <div class="table-cell">{{ formatFileSize(file.sizeBytes) }}</div>
                  <div class="table-cell">
                    <span class="status-badge" [class]="file.status.toLowerCase()">
                      {{ file.status }}
                    </span>
                  </div>
                  <div class="table-cell">{{ formatDate(file.receivedAt) }}</div>
                </div>
              }
            </div>

            @if (totalPages() > 1) {
              <div class="pagination">
                <button 
                  type="button" 
                  class="btn-secondary btn-sm" 
                  [disabled]="currentPage() === 1"
                  (click)="previousPage()">
                  Previous
                </button>
                <span class="page-info">
                  Page {{ currentPage() }} of {{ totalPages() }}
                </span>
                <button 
                  type="button" 
                  class="btn-secondary btn-sm" 
                  [disabled]="currentPage() === totalPages()"
                  (click)="nextPage()">
                  Next
                </button>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .files-container {
      max-width: 100%;
    }

    .files-header {
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

    .files-content {
      background: var(--white);
      border-radius: 0.5rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      padding: 2rem;
    }

    .files-filters {
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--light-gray);
      border-radius: 0.375rem;
      font-style: italic;
      color: var(--medium-gray);
    }

    .files-table {
      border: 1px solid #E9ECEF;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 2fr;
      gap: 1rem;
    }

    .table-header {
      background: var(--background-section);
      font-weight: 600;
    }

    .table-row {
      border-top: 1px solid #F8F9FA;
    }

    .table-row:hover {
      background: var(--light-gray);
    }

    .header-cell, .table-cell {
      padding: 1rem;
      font-family: var(--font-ui);
      font-size: 0.875rem;
    }

    .header-cell {
      color: var(--dark-gray);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .table-cell {
      color: var(--medium-gray);
      display: flex;
      align-items: center;
    }

    .direction-badge, .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .direction-badge.inbound {
      background: rgba(23, 162, 184, 0.1);
      color: var(--info-blue);
    }

    .direction-badge.outbound {
      background: rgba(114, 123, 156, 0.1);
      color: var(--primary-blue-gray);
    }

    .status-badge.success {
      background: rgba(40, 167, 69, 0.1);
      color: var(--success-green);
    }

    .status-badge.pending {
      background: rgba(255, 193, 7, 0.1);
      color: var(--warning-orange);
    }

    .status-badge.processing {
      background: rgba(23, 162, 184, 0.1);
      color: var(--info-blue);
    }

    .status-badge.failed {
      background: rgba(222, 72, 67, 0.1);
      color: var(--accent-coral);
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-info {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--medium-gray);
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 2rem;
      }

      .table-header, .table-row {
        grid-template-columns: 1fr;
        gap: 0;
      }

      .header-cell, .table-cell {
        padding: 0.75rem;
      }

      .table-row {
        border: 1px solid #E9ECEF;
        border-radius: 0.375rem;
        margin-bottom: 0.5rem;
      }

      .table-header {
        display: none;
      }

      .table-cell::before {
        content: attr(data-label);
        font-weight: 600;
        color: var(--dark-gray);
        margin-right: 0.5rem;
      }
    }
  `]
})
export class FilesPageComponent implements OnInit, OnDestroy {
  constructor(private filesStore: FilesStore) {}

  get loading() {
    return this.filesStore.loading;
  }

  get error() {
    return this.filesStore.error;
  }

  get files() {
    return this.filesStore.files;
  }

  get hasFiles() {
    return this.filesStore.hasFiles;
  }

  get currentPage() {
    return this.filesStore.currentPage;
  }

  get totalPages() {
    return this.filesStore.totalPages;
  }

  async ngOnInit(): Promise<void> {
    await this.filesStore.search();
  }

  ngOnDestroy(): void {
    // Optional cleanup if needed
  }

  async refresh(): Promise<void> {
    await this.filesStore.refresh();
  }

  async nextPage(): Promise<void> {
    this.filesStore.nextPage();
  }

  async previousPage(): Promise<void> {
    this.filesStore.previousPage();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}