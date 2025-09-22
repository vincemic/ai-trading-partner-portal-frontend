import { Injectable, signal, computed } from '@angular/core';
import { Observable, firstValueFrom, forkJoin } from 'rxjs';
import { DashboardApiService } from '../core/services/dashboard-api.service';
import { SseClientService } from '../core/services/sse-client.service';
import {
  DashboardSummaryDto,
  TimeSeriesResponse,
  TopErrorsResponse,
  ConnectionHealthPointDto,
  ConnectionCurrentStatusDto,
  ThroughputPointDto,
  LargeFileDto,
  ConnectionPerformancePointDto,
  DailyOpsPointDto,
  FailureBurstPointDto,
  ZeroFileWindowStatusDto,
  SseEvent
} from '../core/models/dto.models';

interface DashboardFilters {
  from: string;
  to: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStore {
  private readonly _summary = signal<DashboardSummaryDto | null>(null);
  private readonly _timeSeries = signal<TimeSeriesResponse | null>(null);
  private readonly _topErrors = signal<TopErrorsResponse | null>(null);
  private readonly _connectionHealth = signal<ConnectionHealthPointDto[]>([]);
  private readonly _connectionStatus = signal<ConnectionCurrentStatusDto | null>(null);
  private readonly _throughput = signal<ThroughputPointDto[]>([]);
  private readonly _largeFiles = signal<LargeFileDto[]>([]);
  private readonly _connectionPerformance = signal<ConnectionPerformancePointDto[]>([]);
  private readonly _dailySummary = signal<DailyOpsPointDto[]>([]);
  private readonly _failureBursts = signal<FailureBurstPointDto[]>([]);
  private readonly _zeroFileWindow = signal<ZeroFileWindowStatusDto | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<DashboardFilters>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString()
  });
  private readonly _advancedMetricsLoaded = signal(false);

  // Basic dashboard signals
  readonly summary = this._summary.asReadonly();
  readonly timeSeries = this._timeSeries.asReadonly();
  readonly topErrors = this._topErrors.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  // Advanced metrics signals
  readonly connectionHealth = this._connectionHealth.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly throughput = this._throughput.asReadonly();
  readonly largeFiles = this._largeFiles.asReadonly();
  readonly connectionPerformance = this._connectionPerformance.asReadonly();
  readonly dailySummary = this._dailySummary.asReadonly();
  readonly failureBursts = this._failureBursts.asReadonly();
  readonly zeroFileWindow = this._zeroFileWindow.asReadonly();
  readonly advancedMetricsLoaded = this._advancedMetricsLoaded.asReadonly();

  // Computed signals
  readonly successRateDisplay = computed(() => {
    const summary = this._summary();
    return summary ? `${summary.successRatePct.toFixed(1)}%` : '0%';
  });

  readonly totalFilesToday = computed(() => {
    const summary = this._summary();
    return summary ? summary.inboundFiles24h + summary.outboundFiles24h : 0;
  });

  readonly avgProcessingTimeDisplay = computed(() => {
    const summary = this._summary();
    if (!summary?.avgProcessingMs24h) return 'N/A';
    return `${(summary.avgProcessingMs24h / 1000).toFixed(1)}s`;
  });

  readonly hasFailureBurst = computed(() => {
    const bursts = this._failureBursts();
    return bursts.length > 0;
  });

  readonly isZeroFileWindowFlagged = computed(() => {
    const window = this._zeroFileWindow();
    return window?.flagged || false;
  });

  constructor(
    private dashboardApiService: DashboardApiService,
    private sseClientService: SseClientService
  ) {
    this.setupSseSubscription();
  }

  private setupSseSubscription(): void {
    this.sseClientService.events$.subscribe((event: SseEvent) => {
      switch (event.type) {
        case 'connection':
          this.handleConnectionEvent(event.data);
          break;
        case 'dashboard.metricsTick':
          this.handleMetricsTick(event.data);
          break;
        case 'throughput.tick':
          this.handleThroughputTick(event.data);
          break;
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
        case 'file.statusChanged':
          this.handleFileStatusChanged(event.data);
          break;
        case 'key.promoted':
        case 'key.revoked':
          // These might trigger dashboard summary updates
          this.handleKeyEvent(event.type, event.data);
          break;
      }
    });
  }

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const filters = this._filters();
      
      // Load basic dashboard data in parallel
      const [summary, timeSeries, topErrors] = await Promise.all([
        firstValueFrom(this.dashboardApiService.getSummary()),
        firstValueFrom(this.dashboardApiService.getTimeSeries(filters)),
        firstValueFrom(this.dashboardApiService.getTopErrors(filters))
      ]);

      this._summary.set(summary);
      this._timeSeries.set(timeSeries);
      this._topErrors.set(topErrors);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      this._loading.set(false);
    }
  }

  async loadAdvancedMetrics(): Promise<void> {
    if (this._advancedMetricsLoaded()) {
      return; // Already loaded
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const filters = this._filters();
      
      // Load advanced metrics in parallel
      const [
        connectionHealth,
        connectionStatus,
        throughput,
        largeFiles,
        connectionPerformance,
        dailySummary,
        failureBursts,
        zeroFileWindow
      ] = await Promise.all([
        firstValueFrom(this.dashboardApiService.getConnectionHealth(filters)),
        firstValueFrom(this.dashboardApiService.getConnectionStatus()),
        firstValueFrom(this.dashboardApiService.getThroughput(filters)),
        firstValueFrom(this.dashboardApiService.getLargeFiles({ ...filters, limit: 10 })),
        firstValueFrom(this.dashboardApiService.getConnectionPerformance(filters)),
        firstValueFrom(this.dashboardApiService.getDailySummary({ days: 7 })),
        firstValueFrom(this.dashboardApiService.getFailureBursts({ lookbackMinutes: 60 })),
        firstValueFrom(this.dashboardApiService.getZeroFileWindow({ windowHours: 4 }))
      ]);

      this._connectionHealth.set(connectionHealth);
      this._connectionStatus.set(connectionStatus);
      this._throughput.set(throughput);
      this._largeFiles.set(largeFiles);
      this._connectionPerformance.set(connectionPerformance);
      this._dailySummary.set(dailySummary);
      this._failureBursts.set(failureBursts);
      this._zeroFileWindow.set(zeroFileWindow);
      this._advancedMetricsLoaded.set(true);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load advanced metrics');
      console.error('Error loading advanced metrics:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    // Refresh basic metrics
    await this.load();
    
    // Refresh advanced metrics if they were previously loaded
    if (this._advancedMetricsLoaded()) {
      await this.loadAdvancedMetrics();
    }
  }

  updateFilters(filters: Partial<DashboardFilters>): void {
    const currentFilters = this._filters();
    this._filters.set({ ...currentFilters, ...filters });
    
    // Reset advanced metrics loaded flag when filters change
    this._advancedMetricsLoaded.set(false);
  }

  private handleMetricsTick(data: any): void {
    // Real-time dashboard metrics update (every 30 seconds from backend)
    // Update the full summary with fresh data from the backend
    if (data && typeof data === 'object') {
      console.log('📊 Dashboard metrics updated via SSE:', data);
      this._summary.set(data);
      
      // If this is a time series point update, add it to the chart
      if (data.timeSeriesPoint) {
        const currentSeries = this._timeSeries();
        if (currentSeries) {
          const updatedPoints = [...currentSeries.points, data.timeSeriesPoint];
          // Keep only last 48 hours of data points (assuming hourly updates)
          const maxPoints = 48;
          if (updatedPoints.length > maxPoints) {
            updatedPoints.splice(0, updatedPoints.length - maxPoints);
          }
          this._timeSeries.set({ points: updatedPoints });
        }
      }
    }
  }

  private handleConnectionEvent(data: any): void {
    // SSE connection confirmed event
    console.log('🔗 SSE connection confirmed:', data.status, data.timestamp);
    // Connection status is already handled by SSE service
    // This is just for logging/debugging
  }

  private handleFileCreated(data: any): void {
    console.log('📄 New file created:', data.fileName, data.direction);
    // Increment counters in real-time
    const currentSummary = this._summary();
    if (currentSummary) {
      const updated = { ...currentSummary };
      if (data.direction === 'Inbound') {
        updated.inboundFiles24h += 1;
      } else if (data.direction === 'Outbound') {
        updated.outboundFiles24h += 1;
      }
      this._summary.set(updated);
    }
  }

  private handleFileStatusChanged(data: any): void {
    console.log('📄 File status changed:', data.fileName, data.oldStatus, '->', data.newStatus);
    // Update success rate if a file completed or failed
    if (data.newStatus === 'Completed' || data.newStatus === 'Failed') {
      // Could trigger a refresh of summary data or update counters
      // For now, we'll let the periodic dashboard.metricsTick handle this
    }
  }

  private handleKeyEvent(eventType: string, data: any): void {
    console.log('🔑 Key event:', eventType, data.keyId);
    // Key operations might affect dashboard - could trigger a refresh
    // For now, just log the event
  }

  private handleThroughputTick(data: ThroughputPointDto): void {
    const currentThroughput = this._throughput();
    this._throughput.set([...currentThroughput, data]);
  }

  private handleFailureBurstAlert(data: FailureBurstPointDto): void {
    const currentBursts = this._failureBursts();
    this._failureBursts.set([...currentBursts, data]);
  }

  private handleZeroFileWindowAlert(data: ZeroFileWindowStatusDto): void {
    this._zeroFileWindow.set(data);
  }

  private handleConnectionStatusChanged(data: ConnectionCurrentStatusDto): void {
    this._connectionStatus.set(data);
  }

  dispose(): void {
    this._summary.set(null);
    this._timeSeries.set(null);
    this._topErrors.set(null);
    this._connectionHealth.set([]);
    this._connectionStatus.set(null);
    this._throughput.set([]);
    this._largeFiles.set([]);
    this._connectionPerformance.set([]);
    this._dailySummary.set([]);
    this._failureBursts.set([]);
    this._zeroFileWindow.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._advancedMetricsLoaded.set(false);
  }
}