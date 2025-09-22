import { Injectable, signal } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SseEvent } from '../models/dto.models';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SseClientService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private lastEventId: string | null = null;
  private eventSubject = new Subject<SseEvent>();
  private connectionStatus = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  private heartbeatTimer: any = null;
  private readonly heartbeatTimeout = 45000; // 45 seconds (3x expected heartbeat interval)

  readonly events$ = this.eventSubject.asObservable();
  readonly connectionStatus$ = this.connectionStatus.asReadonly();

  constructor(private sessionService: SessionService) {
    // Restore last event ID from localStorage for event replay
    this.lastEventId = localStorage.getItem('lastSSEEventId');
  }

  connect(): void {
    if (!environment.sseEnabled) {
      console.log('SSE disabled in environment');
      return;
    }

    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }

    this.disconnect();
    this.connectionStatus.set('connecting');

    try {
      const token = this.sessionService.getToken();
      if (!token) {
        console.error('No session token available for SSE connection');
        this.connectionStatus.set('error');
        return;
      }

      // EventSource doesn't support custom headers, so append token as query param
      const url = new URL(environment.sseBaseUrl, window.location.origin);
      url.searchParams.set('token', token);
      
      // Add lastEventId for event replay if available
      if (this.lastEventId) {
        url.searchParams.set('lastEventId', this.lastEventId);
      }

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        console.log('SSE connection opened - waiting for connection confirmation');
        // Don't set to connected yet - wait for 'connection' event
        this.startHeartbeatTimer();
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.stopHeartbeatTimer();
        this.connectionStatus.set('error');
        this.handleError();
      };

      // Handle specific event types
      this.setupEventHandlers();

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      this.connectionStatus.set('error');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.stopHeartbeatTimer();
    this.connectionStatus.set('disconnected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay
  }

  private startHeartbeatTimer(): void {
    this.stopHeartbeatTimer();
    this.heartbeatTimer = setTimeout(() => {
      console.warn('SSE heartbeat timeout - connection may be stale');
      this.handleError();
    }, this.heartbeatTimeout);
  }

  private resetHeartbeatTimer(): void {
    this.startHeartbeatTimer();
  }

  private stopHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.eventSource) return;

    const eventTypes = [
      'connection',
      'file.created',
      'file.statusChanged',
      'key.promoted',
      'key.revoked',
      'dashboard.metricsTick',
      'sftp.connectionStatusChanged',
      'sftp.failureBurstAlert',
      'sftp.zeroFileWindowAlert',
      'throughput.tick'
    ];

    eventTypes.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event) => {
        this.handleTypedEvent(eventType as SseEvent['type'], event);
      });
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      // Handle heartbeat comments (:hb)
      if (event.data.startsWith(':')) {
        this.resetHeartbeatTimer();
        return;
      }

      // Store last event ID for reconnection replay
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
        localStorage.setItem('lastSSEEventId', event.lastEventId);
      }
      
      const data = JSON.parse(event.data);
      this.eventSubject.next({
        type: 'dashboard.metricsTick', // default type for generic messages
        data: data,
        id: event.lastEventId || undefined
      });
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }

  private handleTypedEvent(type: SseEvent['type'], event: MessageEvent): void {
    try {
      // Store last event ID for reconnection replay
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
        localStorage.setItem('lastSSEEventId', event.lastEventId);
      }
      
      const data = JSON.parse(event.data);
      
      // Handle connection event specially - this confirms successful connection
      if (type === 'connection') {
        console.log('✅ SSE connection confirmed:', data.status, data.timestamp);
        this.connectionStatus.set('connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay
      }
      
      this.eventSubject.next({
        type: type,
        data: data,
        id: event.lastEventId || undefined
      });
    } catch (error) {
      console.error(`Error parsing SSE event of type ${type}:`, error);
    }
  }

  private handleError(): void {
    if (this.eventSource?.readyState === EventSource.CLOSED) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max SSE reconnection attempts reached');
      this.connectionStatus.set('error');
      return;
    }

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000; // Up to 1 second jitter
    const delay = Math.min(this.reconnectDelay + jitter, 30000); // Max 30 seconds

    console.log(`Scheduling SSE reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      
      // Check if user is still authenticated before reconnecting
      if (this.sessionService.isAuthenticated()) {
        this.connect();
      } else {
        console.log('User no longer authenticated, not reconnecting SSE');
        this.connectionStatus.set('disconnected');
      }
      
      // Exponential backoff for next attempt
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }, delay);
  }

  // Inject test events for development/testing
  injectTestEvent(type: SseEvent['type'], data: any): void {
    if (environment.enableLogging) {
      console.log('Injecting test SSE event:', type, data);
    }
    
    this.eventSubject.next({
      type: type,
      data: data,
      id: `test-${Date.now()}`
    });
  }

  // Get current connection status for UI display
  getConnectionStatusText(): string {
    const status = this.connectionStatus();
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  }
}