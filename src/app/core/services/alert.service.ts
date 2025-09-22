import { Injectable, signal } from '@angular/core';
import { SseClientService } from './sse-client.service';

export interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissible: boolean;
  autoTimeout?: number; // milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly _alerts = signal<AlertItem[]>([]);
  private alertTimeouts = new Map<string, any>();

  readonly alerts = this._alerts.asReadonly();

  constructor(private sseClientService: SseClientService) {
    this.setupSseSubscription();
  }

  private setupSseSubscription(): void {
    this.sseClientService.events$.subscribe(event => {
      switch (event.type) {
        case 'sftp.failureBurstAlert':
          this.handleFailureBurstAlert(event.data);
          break;
        case 'sftp.zeroFileWindowAlert':
          this.handleZeroFileWindowAlert(event.data);
          break;
        case 'sftp.connectionStatusChanged':
          this.handleConnectionStatusChanged(event.data);
          break;
        case 'file.created':
          this.handleFileCreated(event.data);
          break;
        case 'key.promoted':
          this.handleKeyPromoted(event.data);
          break;
        case 'key.revoked':
          this.handleKeyRevoked(event.data);
          break;
      }
    });
  }

  private handleFailureBurstAlert(data: any): void {
    const windowStart = new Date(data.windowStart).toLocaleTimeString();
    this.addAlert({
      type: 'error',
      title: 'Connection Failure Burst',
      message: `${data.failureCount} connection failures detected since ${windowStart}`,
      dismissible: true,
      autoTimeout: 10000
    });
  }

  private handleZeroFileWindowAlert(data: any): void {
    if (data.flagged) {
      this.addAlert({
        type: 'warning',
        title: 'No File Activity',
        message: `No inbound files received in the last ${data.windowHours} hours`,
        dismissible: true,
        autoTimeout: 8000
      });
    }
  }

  private handleConnectionStatusChanged(data: any): void {
    if (data.status === 'Failed' || data.status === 'Disconnected') {
      this.addAlert({
        type: 'warning',
        title: 'SFTP Connection Issue',
        message: `SFTP connection ${data.status.toLowerCase()}`,
        dismissible: true,
        autoTimeout: 5000
      });
    } else if (data.status === 'Connected') {
      // Clear any existing connection alerts and show success
      this.clearAlertsByTitle('SFTP Connection Issue');
      this.addAlert({
        type: 'success',
        title: 'SFTP Connected',
        message: 'SFTP connection restored successfully',
        dismissible: true,
        autoTimeout: 3000
      });
    }
  }

  private handleFileCreated(data: any): void {
    // Show notification for important file types
    if (data.docType === '850') {
      this.addAlert({
        type: 'info',
        title: 'New Purchase Order',
        message: `Purchase Order ${data.fileName} received`,
        dismissible: true,
        autoTimeout: 4000
      });
    }
  }

  private handleKeyPromoted(data: any): void {
    this.addAlert({
      type: 'success',
      title: 'Key Promoted',
      message: `PGP key ${data.keyId} promoted to primary`,
      dismissible: true,
      autoTimeout: 5000
    });
  }

  private handleKeyRevoked(data: any): void {
    this.addAlert({
      type: 'warning',
      title: 'Key Revoked',
      message: `PGP key ${data.keyId} has been revoked`,
      dismissible: true,
      autoTimeout: 6000
    });
  }

  addAlert(alert: Omit<AlertItem, 'id' | 'timestamp'>): void {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: AlertItem = {
      ...alert,
      id,
      timestamp: new Date()
    };

    const currentAlerts = this._alerts();
    this._alerts.set([newAlert, ...currentAlerts]);

    // Set up auto-timeout if specified
    if (alert.autoTimeout) {
      const timeoutId = setTimeout(() => {
        this.dismissAlert(id);
      }, alert.autoTimeout);
      
      this.alertTimeouts.set(id, timeoutId);
    }
  }

  dismissAlert(id: string): void {
    const currentAlerts = this._alerts();
    this._alerts.set(currentAlerts.filter(alert => alert.id !== id));
    
    // Clear timeout if it exists
    const timeoutId = this.alertTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.alertTimeouts.delete(id);
    }
  }

  clearAllAlerts(): void {
    // Clear all timeouts
    this.alertTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.alertTimeouts.clear();
    
    this._alerts.set([]);
  }

  private clearAlertsByTitle(title: string): void {
    const currentAlerts = this._alerts();
    const remainingAlerts = currentAlerts.filter(alert => {
      if (alert.title === title) {
        // Clear timeout for dismissed alert
        const timeoutId = this.alertTimeouts.get(alert.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.alertTimeouts.delete(alert.id);
        }
        return false;
      }
      return true;
    });
    
    this._alerts.set(remainingAlerts);
  }

  // Manual alert methods for other parts of the app
  showSuccess(title: string, message: string, autoTimeout: number = 3000): void {
    this.addAlert({
      type: 'success',
      title,
      message,
      dismissible: true,
      autoTimeout
    });
  }

  showError(title: string, message: string, dismissible: boolean = true): void {
    this.addAlert({
      type: 'error',
      title,
      message,
      dismissible
    });
  }

  showWarning(title: string, message: string, autoTimeout: number = 5000): void {
    this.addAlert({
      type: 'warning',
      title,
      message,
      dismissible: true,
      autoTimeout
    });
  }

  showInfo(title: string, message: string, autoTimeout: number = 4000): void {
    this.addAlert({
      type: 'info',
      title,
      message,
      dismissible: true,
      autoTimeout
    });
  }
}