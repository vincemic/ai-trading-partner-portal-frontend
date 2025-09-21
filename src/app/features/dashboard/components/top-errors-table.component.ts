import { Component, Input, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TopErrorsResponse } from '../../../core/models/dto.models';

@Component({
  selector: 'app-top-errors-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">{{ title }}</h3>
        <div class="table-actions">
          @if (hasErrors()) {
            <button 
              mat-button 
              color="primary" 
              (click)="onViewAllErrors()"
              class="view-all-btn">
              View All Errors
            </button>
          }
        </div>
      </div>
      
      @if (loading()) {
        <div class="table-skeleton">
          @for (row of skeletonRows; track $index) {
            <div class="skeleton-row">
              <div class="skeleton-cell category"></div>
              <div class="skeleton-cell count"></div>
              <div class="skeleton-cell percentage"></div>
              <div class="skeleton-cell action"></div>
            </div>
          }
        </div>
      } @else if (hasErrors()) {
        <div class="errors-table">
          <div class="table-header-row">
            <div class="header-cell category">Error Category</div>
            <div class="header-cell count">Count</div>
            <div class="header-cell percentage">Percentage</div>
            <div class="header-cell action">Action</div>
          </div>
          
          @for (error of topErrorsData(); track error.category) {
            <div class="table-row" (click)="onErrorClick(error.category)">
              <div class="data-cell category">
                <div class="error-info">
                  <div class="error-details">
                    <div class="error-category">{{ formatErrorCategory(error.category) }}</div>
                    <div class="error-description">{{ getErrorDescription(error.category) }}</div>
                  </div>
                </div>
              </div>
              <div class="data-cell count">
                <span class="error-count">{{ error.count }}</span>
              </div>
              <div class="data-cell percentage">
                <div class="percentage-container">
                  <span class="percentage-text">{{ getPercentage(error.count).toFixed(1) }}%</span>
                  <div class="percentage-bar">
                    <div 
                      class="percentage-fill" 
                      [style.width.%]="getPercentage(error.count)">
                    </div>
                  </div>
                </div>
              </div>
              <div class="data-cell action">
                <button 
                  mat-button 
                  (click)="onFilterByError(error.category); $event.stopPropagation()"
                  [title]="'Filter files by ' + error.category">
                  Filter
                </button>
              </div>
            </div>
          }
        </div>
        
        @if (totalErrorCount() > 0) {
          <div class="table-summary">
            <div class="summary-item">
              <span class="summary-label">Total Errors:</span>
              <span class="summary-value error">{{ totalErrorCount() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Error Rate:</span>
              <span class="summary-value" [class]="getErrorRateClass()">
                {{ getErrorRate().toFixed(2) }}%
              </span>
            </div>
          </div>
        }
      } @else {
        <div class="table-empty">
          <h4>No Errors Detected</h4>
          <p>All file transfers are processing successfully.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .table-container {
      background: var(--white);
      border-radius: 0.75rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      transition: box-shadow 0.3s ease;
    }

    .table-container:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .table-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin: 0;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }

    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .table-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 0.5fr;
      gap: 1rem;
      align-items: center;
      padding: 1rem 0;
    }

    .skeleton-cell {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-cell.category {
      height: 40px;
    }

    .skeleton-cell.action {
      height: 32px;
      width: 32px;
      border-radius: 50%;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .errors-table {
      display: flex;
      flex-direction: column;
    }

    .table-header-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 0.5fr;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 2px solid #F8F9FA;
    }

    .header-cell {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-blue-gray);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 0.5fr;
      gap: 1rem;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid #F8F9FA;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .table-row:hover {
      background: rgba(114, 123, 156, 0.02);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .data-cell {
      display: flex;
      align-items: center;
    }

    .error-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .error-icon {
      color: var(--accent-coral);
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .error-details {
      min-width: 0;
      flex: 1;
    }

    .error-category {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.25rem;
    }

    .error-description {
      font-family: var(--font-body);
      font-size: 0.75rem;
      color: var(--primary-blue-gray);
      line-height: 1.3;
    }

    .error-count {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--accent-coral);
    }

    .percentage-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
    }

    .percentage-text {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-navy);
    }

    .percentage-bar {
      height: 4px;
      background: #F8F9FA;
      border-radius: 2px;
      overflow: hidden;
    }

    .percentage-fill {
      height: 100%;
      background: var(--accent-coral);
      transition: width 0.3s ease;
      border-radius: 2px;
    }

    .table-empty {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--primary-blue-gray);
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--success-green);
      margin-bottom: 1rem;
    }

    .table-empty h4 {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin: 0 0 0.5rem 0;
    }

    .table-empty p {
      font-family: var(--font-body);
      font-size: 1rem;
      margin: 0;
    }

    .table-summary {
      display: flex;
      justify-content: space-between;
      padding: 1rem 0 0 0;
      margin-top: 1rem;
      border-top: 1px solid #F8F9FA;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .summary-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
      font-weight: 500;
    }

    .summary-value {
      font-family: var(--font-heading);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .summary-value.error {
      color: var(--accent-coral);
    }

    .summary-value.low {
      color: var(--success-green);
    }

    .summary-value.medium {
      color: var(--warning-orange);
    }

    .summary-value.high {
      color: var(--accent-coral);
    }

    @media (max-width: 768px) {
      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .table-header-row,
      .table-row,
      .skeleton-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .table-row {
        padding: 1rem;
        border: 1px solid #F8F9FA;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
        background: var(--white);
      }

      .data-cell {
        justify-content: space-between;
      }

      .data-cell.category {
        flex-direction: column;
        align-items: flex-start;
      }

      .error-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .percentage-container {
        flex-direction: row;
        align-items: center;
        gap: 1rem;
      }

      .percentage-bar {
        flex: 1;
      }

      .table-summary {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class TopErrorsTableComponent {
  @Input() title = 'Top Error Categories';
  @Input() topErrors = (): TopErrorsResponse | null => null;
  @Input() loading = (): boolean => false;
  @Input() totalFiles = (): number => 0;

  @Output() errorClicked = new EventEmitter<string>();
  @Output() filterByError = new EventEmitter<string>();
  @Output() viewAllErrors = new EventEmitter<void>();

  readonly skeletonRows = Array.from({ length: 5 }, () => ({}));

  readonly hasErrors = computed(() => {
    const errors = this.topErrors();
    return errors && errors.categories && errors.categories.length > 0;
  });

  readonly topErrorsData = computed(() => {
    const errors = this.topErrors();
    return errors?.categories?.slice(0, 5) || [];
  });

  readonly totalErrorCount = computed(() => {
    const errors = this.topErrorsData();
    return errors.reduce((sum, error) => sum + error.count, 0);
  });

  readonly getErrorRate = computed(() => {
    const total = this.totalFiles();
    const errorCount = this.totalErrorCount();
    return total > 0 ? (errorCount / total) * 100 : 0;
  });

  getPercentage(count: number): number {
    const total = this.totalErrorCount();
    return total > 0 ? (count / total) * 100 : 0;
  }

  getErrorRateClass(): string {
    const rate = this.getErrorRate();
    if (rate <= 1) return 'low';
    if (rate <= 5) return 'medium';
    return 'high';
  }

  formatErrorCategory(category: string): string {
    // Convert snake_case or camelCase to Title Case
    return category
      .replace(/[_-]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  getErrorDescription(category: string): string {
    // Map error categories to user-friendly descriptions
    const descriptions: { [key: string]: string } = {
      'authentication_failed': 'Failed to authenticate with remote server',
      'connection_timeout': 'Connection to server timed out',
      'file_not_found': 'Requested file does not exist',
      'permission_denied': 'Insufficient permissions to access file',
      'invalid_format': 'File format is invalid or corrupted',
      'network_error': 'Network connectivity issues',
      'server_error': 'Remote server encountered an error',
      'validation_failed': 'File failed validation checks',
      'disk_full': 'Insufficient disk space on server',
      'rate_limit_exceeded': 'Too many requests in short period'
    };

    return descriptions[category] || 'Error occurred during file processing';
  }

  onErrorClick(category: string): void {
    this.errorClicked.emit(category);
  }

  onFilterByError(category: string): void {
    this.filterByError.emit(category);
  }

  onViewAllErrors(): void {
    this.viewAllErrors.emit();
  }
}