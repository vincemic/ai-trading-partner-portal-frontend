import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditStore } from '../../state/audit.store';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-container">
      <div class="audit-header">
        <h1 class="page-title">Audit Log</h1>
        <p class="page-subtitle">Review credential operations and system events</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading audit events...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button type="button" class="btn-primary" (click)="refresh()">
            Try Again
          </button>
        </div>
      } @else {
        <div class="audit-content">
          <div class="audit-filters">
            <p>Filtering and search functionality will be implemented in future iterations.</p>
          </div>

          @if (!hasEvents()) {
            <div class="empty-state">
              <p>No audit events found.</p>
            </div>
          } @else {
            <div class="audit-table">
              <div class="table-header">
                <div class="header-cell">Timestamp</div>
                <div class="header-cell">User</div>
                <div class="header-cell">Operation</div>
                <div class="header-cell">Status</div>
                <div class="header-cell">Partner</div>
              </div>
              @for (event of events()?.items || []; track event.auditId) {
                <div class="table-row">
                  <div class="table-cell">{{ formatDateTime(event.timestamp) }}</div>
                  <div class="table-cell">
                    <div class="user-info">
                      <span class="user-id">{{ event.actorUserId }}</span>
                      <span class="user-role">{{ event.actorRole }}</span>
                    </div>
                  </div>
                  <div class="table-cell">{{ event.operationType }}</div>
                  <div class="table-cell">
                    <span class="status-badge" [class]="event.success ? 'success' : 'failed'">
                      {{ event.success ? 'Success' : 'Failed' }}
                    </span>
                  </div>
                  <div class="table-cell">{{ event.partnerId }}</div>
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
    .audit-container {
      max-width: 100%;
    }

    .audit-header {
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

    .audit-content {
      background: var(--white);
      border-radius: 0.5rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      padding: 2rem;
    }

    .audit-filters {
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--light-gray);
      border-radius: 0.375rem;
      font-style: italic;
      color: var(--medium-gray);
    }

    .audit-table {
      border: 1px solid #E9ECEF;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 2fr 2fr 2fr 1fr 1fr;
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

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-id {
      font-weight: 600;
      color: var(--dark-gray);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--primary-blue-gray);
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

    .status-badge.success {
      background: rgba(40, 167, 69, 0.1);
      color: var(--success-green);
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
    }
  `]
})
export class AuditPageComponent implements OnInit, OnDestroy {
  constructor(private auditStore: AuditStore) {}

  get loading() {
    return this.auditStore.loading;
  }

  get error() {
    return this.auditStore.error;
  }

  get events() {
    return this.auditStore.events;
  }

  get hasEvents() {
    return this.auditStore.hasEvents;
  }

  get currentPage() {
    return this.auditStore.currentPage;
  }

  get totalPages() {
    return this.auditStore.totalPages;
  }

  async ngOnInit(): Promise<void> {
    await this.auditStore.search();
  }

  ngOnDestroy(): void {
    // Optional cleanup if needed
  }

  async refresh(): Promise<void> {
    await this.auditStore.refresh();
  }

  async nextPage(): Promise<void> {
    this.auditStore.nextPage();
  }

  async previousPage(): Promise<void> {
    this.auditStore.previousPage();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}