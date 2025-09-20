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
  private reconnectTimeouts = [1000, 2000, 5000, 10000, 15000, 30000];
  private lastEventId: string | null = null;
  private eventSubject = new Subject<SseEvent>();
  private connectionStatus = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  readonly events$ = this.eventSubject.asObservable();
  readonly connectionStatus$ = this.connectionStatus.asReadonly();

  constructor(private sessionService: SessionService) {}

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
      const url = new URL(environment.sseBaseUrl);
      url.searchParams.set('sessionToken', token);
      
      if (this.lastEventId) {
        url.searchParams.set('lastEventId', this.lastEventId);
      }

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
        this.connectionStatus.set('connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
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
    this.connectionStatus.set('disconnected');
    this.reconnectAttempts = 0;
  }

  private setupEventHandlers(): void {
    if (!this.eventSource) return;

    const eventTypes = [
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
      // Handle heartbeat comments
      if (event.data.startsWith(':')) {
        return;
      }

      this.lastEventId = event.lastEventId || null;
      
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
      this.lastEventId = event.lastEventId || null;
      
      const data = JSON.parse(event.data);
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

    const timeout = this.reconnectTimeouts[
      Math.min(this.reconnectAttempts, this.reconnectTimeouts.length - 1)
    ];

    console.log(`Scheduling SSE reconnect in ${timeout}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      
      // Check if user is still authenticated before reconnecting
      if (this.sessionService.isAuthenticated()) {
        this.connect();
      } else {
        console.log('User no longer authenticated, not reconnecting SSE');
        this.connectionStatus.set('disconnected');
      }
    }, timeout);
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
}