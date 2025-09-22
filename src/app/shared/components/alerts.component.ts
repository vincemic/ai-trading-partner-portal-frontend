import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, AlertItem } from '../../core/services/alert.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alerts-container">
      @for (alert of alerts(); track alert.id) {
        <div 
          class="alert" 
          [attr.data-type]="alert.type"
          [attr.data-dismissible]="alert.dismissible">
          
          <div class="alert-icon">
            @switch (alert.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('info') {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              }
            }
          </div>

          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-timestamp">{{ formatTimestamp(alert.timestamp) }}</div>
          </div>

          @if (alert.dismissible) {
            <button 
              type="button" 
              class="alert-dismiss"
              (click)="dismissAlert(alert.id)"
              aria-label="Dismiss alert">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .alerts-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      pointer-events: none;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(8px);
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
      position: relative;
      overflow: hidden;
    }

    .alert::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
    }

    .alert[data-type="success"] {
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #065f46;
    }

    .alert[data-type="success"]::before {
      background-color: #10b981;
    }

    .alert[data-type="error"] {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #991b1b;
    }

    .alert[data-type="error"]::before {
      background-color: #ef4444;
    }

    .alert[data-type="warning"] {
      background-color: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: #92400e;
    }

    .alert[data-type="warning"]::before {
      background-color: #f59e0b;
    }

    .alert[data-type="info"] {
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #1e40af;
    }

    .alert[data-type="info"]::before {
      background-color: #3b82f6;
    }

    .alert-icon {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .alert-content {
      flex: 1;
      min-width: 0;
    }

    .alert-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      line-height: 1.25;
    }

    .alert-message {
      font-size: 0.875rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    .alert-timestamp {
      font-size: 0.75rem;
      opacity: 0.7;
      font-weight: 500;
    }

    .alert-dismiss {
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 0.25rem;
      color: currentColor;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      margin-top: 0.125rem;
    }

    .alert-dismiss:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.05);
    }

    .alert-dismiss:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .alerts-container {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }

      .alert {
        padding: 0.75rem;
      }
    }
  `]
})
export class AlertsComponent {
  private alertService = inject(AlertService);

  alerts = this.alertService.alerts;

  dismissAlert(id: string): void {
    this.alertService.dismissAlert(id);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else {
      return timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }
}