import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import {
  ConnectionHealthPointDto,
  ConnectionCurrentStatusDto,
  ThroughputPointDto,
  LargeFileDto,
  ConnectionPerformancePointDto,
  DailyOpsPointDto,
  FailureBurstPointDto,
  ZeroFileWindowStatusDto
} from '../../../core/models/dto.models';

@Component({
  selector: 'app-advanced-metrics-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    NgxEchartsModule
  ],
  template: `
    <div class="advanced-metrics-container">
      <mat-expansion-panel 
        [expanded]="expanded()"
        (expandedChange)="onExpansionChange($event)"
        class="metrics-panel">
        
        <mat-expansion-panel-header>
          <mat-panel-title>
            Advanced Metrics
          </mat-panel-title>
          <mat-panel-description>
            {{ expanded() ? 'Hide detailed analytics' : 'View detailed analytics and performance metrics' }}
          </mat-panel-description>
        </mat-expansion-panel-header>

        <div class="metrics-content">
          @if (loading()) {
            <div class="loading-section">
              <div class="loading-spinner"></div>
              <p>Loading advanced metrics...</p>
            </div>
          } @else {
            <!-- Connection Health Chart -->
            <div class="metric-section">
              <h4>Connection Health (24h)</h4>
              @if (hasConnectionHealth()) {
                <div class="chart-wrapper">
                  <div echarts [options]="connectionHealthOptions()" class="chart small"></div>
                </div>
              } @else {
                <div class="no-data">No connection health data available</div>
              }
            </div>

            <!-- Current Connection Status -->
            <div class="metric-section">
              <h4>Current Connection Status</h4>
              @if (connectionStatus()) {
                <div class="status-info">
                  <div class="status-item" [class]="getConnectionStatusClass()">
                    <div class="status-details">
                      <div class="status-value">{{ connectionStatus()!.status }}</div>
                      <div class="status-label">Last Check: {{ formatTime(connectionStatus()!.lastCheck) }}</div>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="no-data">Connection status unavailable</div>
              }
            </div>

            <!-- Throughput Metrics -->
            <div class="metric-section">
              <h4>Throughput Analysis</h4>
              @if (hasThroughput()) {
                <div class="chart-wrapper">
                  <div echarts [options]="throughputOptions()" class="chart small"></div>
                </div>
              } @else {
                <div class="no-data">No throughput data available</div>
              }
            </div>

            <!-- Large Files Table -->
            <div class="metric-section">
              <h4>Large Files (Top 10)</h4>
              @if (hasLargeFiles()) {
                <div class="large-files-table">
                  <div class="table-header">
                    <div class="header-cell">File Name</div>
                    <div class="header-cell">Size</div>
                    <div class="header-cell">Received</div>
                  </div>
                  @for (file of largeFiles(); track file.fileName) {
                    <div class="table-row">
                      <div class="data-cell filename">{{ file.fileName }}</div>
                      <div class="data-cell size">{{ formatBytes(file.sizeBytes) }}</div>
                      <div class="data-cell date">{{ formatTime(file.receivedAt) }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-data">No large files processed recently</div>
              }
            </div>

            <!-- Connection Performance -->
            <div class="metric-section">
              <h4>Connection Performance</h4>
              @if (hasConnectionPerformance()) {
                <div class="chart-wrapper">
                  <div echarts [options]="connectionPerformanceOptions()" class="chart small"></div>
                </div>
              } @else {
                <div class="no-data">No performance data available</div>
              }
            </div>

            <!-- Daily Operations Summary -->
            <div class="metric-section">
              <h4>Daily Operations (7 days)</h4>
              @if (hasDailySummary()) {
                <div class="chart-wrapper">
                  <div echarts [options]="dailySummaryOptions()" class="chart small"></div>
                </div>
              } @else {
                <div class="no-data">No daily summary available</div>
              }
            </div>

            <!-- Alert Sections -->
            @if (hasFailureBursts()) {
              <div class="metric-section alert-section">
                <h4>
                  Failure Burst Alerts
                </h4>
                <div class="alert-list">
                  @for (burst of failureBursts(); track burst.windowStart) {
                    <div class="alert-item">
                      <div class="alert-time">{{ formatTime(burst.windowStart) }}</div>
                      <div class="alert-message">{{ burst.failureCount }} failures detected in short window</div>
                    </div>
                  }
                </div>
              </div>
            }

            @if (isZeroFileWindowFlagged()) {
              <div class="metric-section alert-section">
                <h4>
                  Zero File Window Alert
                </h4>
                <div class="alert-item">
                  <div class="alert-message">
                    No files received in the last {{ zeroFileWindow()!.windowHours }} hours.
                    Inbound files: {{ zeroFileWindow()!.inboundFiles }}
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: [`
    .advanced-metrics-container {
      margin-top: 2rem;
    }

    .metrics-panel {
      background: var(--white);
      border-radius: 0.75rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .metrics-panel mat-expansion-panel-header {
      padding: 1.5rem;
    }

    .metrics-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-navy);
    }

    .metrics-panel mat-panel-description {
      font-family: var(--font-body);
      color: var(--primary-blue-gray);
    }

    .metrics-content {
      padding: 0 1.5rem 1.5rem 1.5rem;
    }

    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
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

    .metric-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #F8F9FA;
      border-radius: 0.5rem;
      background: rgba(248, 249, 250, 0.3);
    }

    .metric-section h4 {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .chart-wrapper {
      background: var(--white);
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid #E9ECEF;
    }

    .chart {
      height: 200px;
      width: 100%;
    }

    .chart.small {
      height: 150px;
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: var(--primary-blue-gray);
      font-style: italic;
      background: var(--white);
      border-radius: 0.5rem;
      border: 1px solid #E9ECEF;
    }

    .status-info {
      background: var(--white);
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid #E9ECEF;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
    }

    .status-item.online {
      background: rgba(40, 167, 69, 0.1);
      border-left: 4px solid var(--success-green);
    }

    .status-item.offline {
      background: rgba(222, 72, 67, 0.1);
      border-left: 4px solid var(--accent-coral);
    }

    .status-item.warning {
      background: rgba(255, 193, 7, 0.1);
      border-left: 4px solid var(--warning-orange);
    }

    .status-details {
      flex: 1;
    }

    .status-value {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.25rem;
    }

    .status-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
    }

    .large-files-table {
      background: var(--white);
      border-radius: 0.5rem;
      border: 1px solid #E9ECEF;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #F8F9FA;
      border-bottom: 1px solid #E9ECEF;
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
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #F8F9FA;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .data-cell {
      font-family: var(--font-body);
      font-size: 0.875rem;
      color: var(--primary-navy);
    }

    .data-cell.filename {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      word-break: break-all;
    }

    .data-cell.size {
      font-weight: 600;
      color: var(--primary-blue-gray);
    }

    .data-cell.date {
      color: var(--primary-blue-gray);
    }

    .alert-section {
      border-left: 4px solid var(--warning-orange);
      background: rgba(255, 193, 7, 0.05);
    }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-item {
      background: var(--white);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 193, 7, 0.2);
    }

    .alert-time {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--warning-orange);
      margin-bottom: 0.25rem;
    }

    .alert-message {
      font-family: var(--font-body);
      font-size: 0.875rem;
      color: var(--primary-navy);
    }

    @media (max-width: 768px) {
      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .chart {
        height: 150px;
      }

      .chart.small {
        height: 120px;
      }

      .status-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class AdvancedMetricsPanelComponent {
  @Input() connectionHealth = (): ConnectionHealthPointDto[] => [];
  @Input() connectionStatus = (): ConnectionCurrentStatusDto | null => null;
  @Input() throughput = (): ThroughputPointDto[] => [];
  @Input() largeFiles = (): LargeFileDto[] => [];
  @Input() connectionPerformance = (): ConnectionPerformancePointDto[] => [];
  @Input() dailySummary = (): DailyOpsPointDto[] => [];
  @Input() failureBursts = (): FailureBurstPointDto[] => [];
  @Input() zeroFileWindow = (): ZeroFileWindowStatusDto | null => null;
  @Input() loading = (): boolean => false;
  @Input() onLoadAdvanced!: () => Promise<void>;

  private readonly _expanded = signal(false);
  readonly expanded = this._expanded.asReadonly();

  readonly hasConnectionHealth = computed(() => this.connectionHealth().length > 0);
  readonly hasThroughput = computed(() => this.throughput().length > 0);
  readonly hasLargeFiles = computed(() => this.largeFiles().length > 0);
  readonly hasConnectionPerformance = computed(() => this.connectionPerformance().length > 0);
  readonly hasDailySummary = computed(() => this.dailySummary().length > 0);
  readonly hasFailureBursts = computed(() => this.failureBursts().length > 0);
  readonly isZeroFileWindowFlagged = computed(() => this.zeroFileWindow()?.flagged || false);

  readonly connectionHealthOptions = computed(() => {
    const data = this.connectionHealth();
    if (data.length === 0) return {};

    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 20, bottom: 40, left: 40, right: 20 },
      xAxis: {
        type: 'time',
        data: data.map(p => p.timestamp)
      },
      yAxis: { type: 'value', name: 'Success Rate %' },
      series: [{
        name: 'Success Rate',
        type: 'line',
        data: data.map(p => [p.timestamp, p.successRatePct]),
        smooth: true,
        lineStyle: { color: '#28A745' }
      }]
    } as EChartsOption;
  });

  readonly throughputOptions = computed(() => {
    const data = this.throughput();
    if (data.length === 0) return {};

    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 20, bottom: 40, left: 40, right: 20 },
      xAxis: {
        type: 'time',
        data: data.map(p => p.timestamp)
      },
      yAxis: { type: 'value', name: 'Bytes/Hour' },
      series: [{
        name: 'Throughput',
        type: 'bar',
        data: data.map(p => [p.timestamp, p.totalBytes]),
        itemStyle: { color: '#17A2B8' }
      }]
    } as EChartsOption;
  });

  readonly connectionPerformanceOptions = computed(() => {
    const data = this.connectionPerformance();
    if (data.length === 0) return {};

    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 20, bottom: 40, left: 40, right: 20 },
      xAxis: {
        type: 'time',
        data: data.map(p => p.timestamp)
      },
      yAxis: { type: 'value', name: 'Response Time (ms)' },
      series: [
        {
          name: 'Average',
          type: 'line',
          data: data.map(p => [p.timestamp, p.avgMs]),
          lineStyle: { color: '#17A2B8' }
        },
        {
          name: 'P95',
          type: 'line',
          data: data.map(p => [p.timestamp, p.p95Ms]),
          lineStyle: { color: '#FFC107' }
        }
      ]
    } as EChartsOption;
  });

  readonly dailySummaryOptions = computed(() => {
    const data = this.dailySummary();
    if (data.length === 0) return {};

    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 20, bottom: 40, left: 40, right: 20 },
      xAxis: {
        type: 'category',
        data: data.map(p => new Date(p.date).toLocaleDateString())
      },
      yAxis: { type: 'value', name: 'File Count' },
      series: [
        {
          name: 'Successful',
          type: 'bar',
          stack: 'total',
          data: data.map(p => p.successfulFiles),
          itemStyle: { color: '#28A745' }
        },
        {
          name: 'Failed',
          type: 'bar',
          stack: 'total',
          data: data.map(p => p.failedFiles),
          itemStyle: { color: '#DE4843' }
        }
      ]
    } as EChartsOption;
  });

  async onExpansionChange(expanded: boolean): Promise<void> {
    this._expanded.set(expanded);
    
    if (expanded && this.onLoadAdvanced) {
      await this.onLoadAdvanced();
    }
  }

  getConnectionStatusClass(): string {
    const status = this.connectionStatus();
    if (!status) return '';
    
    switch (status.status.toLowerCase()) {
      case 'online':
      case 'connected':
        return 'online';
      case 'offline':
      case 'disconnected':
        return 'offline';
      default:
        return 'warning';
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}