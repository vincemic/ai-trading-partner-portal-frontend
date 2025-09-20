import { Injectable, signal, computed } from '@angular/core';
import { SessionService } from '../core/services/session.service';
import { SseClientService } from '../core/services/sse-client.service';

@Injectable({
  providedIn: 'root'
})
export class AppSessionStore {
  private readonly _isConnected = signal(false);
  
  readonly isConnected = this._isConnected.asReadonly();

  constructor(
    private sessionService: SessionService,
    private sseClientService: SseClientService
  ) {
    // Auto-connect SSE when authenticated
    this.setupSseAutoConnect();
  }

  get session() {
    return this.sessionService.session;
  }

  get isAuthenticated() {
    return this.sessionService.isAuthenticated;
  }

  get sseConnectionStatus() {
    return this.sseClientService.connectionStatus$;
  }

  private setupSseAutoConnect(): void {
    // Watch for authentication state changes
    const isAuth = this.isAuthenticated;
    
    // Use effect to react to authentication changes
    // Note: In a real app, you might use effect() from @angular/core
    // For now, we'll use a simple subscription pattern
    this.watchAuthenticationChanges();
  }

  private watchAuthenticationChanges(): void {
    // Simple polling check for demo purposes
    // In production, you'd use proper reactive patterns
    setInterval(() => {
      const connectionStatus = this.sseClientService.connectionStatus$();
      if (this.isAuthenticated() && connectionStatus !== 'connected') {
        // Auto-connect SSE if authenticated and not connected
        this.connectSse();
      } else if (!this.isAuthenticated()) {
        // Disconnect SSE if not authenticated
        this.disconnectSse();
      }
    }, 1000);
  }

  connectSse(): void {
    if (this.isAuthenticated()) {
      this.sseClientService.connect();
      this._isConnected.set(true);
    }
  }

  disconnectSse(): void {
    this.sseClientService.disconnect();
    this._isConnected.set(false);
  }

  logout(): void {
    this.disconnectSse();
    this.sessionService.logout();
  }
}