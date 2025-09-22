import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardSummaryDto } from '../../../core/models/dto.models';

@Component({
  selector: 'app-kpi-tiles',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="kpi-grid">
      <div class="kpi-tile" [class.trend-up]="filesTrend() === 'up'" [class.trend-down]="filesTrend() === 'down'">
        <div class="kpi-header">
          <span class="kpi-label">Files Today</span>
          @if (filesTrend() !== 'neutral') {
            {{ filesTrend() === 'up' ? '↗' : '↘' }}
          }
        </div>
        <div class="kpi-value">{{ totalFiles() }}</div>
        <div class="kpi-breakdown">
          <span class="breakdown-item">
            {{ summary()?.inboundFiles24h || 0 }} In
          </span>
          <span class="breakdown-item">
            {{ summary()?.outboundFiles24h || 0 }} Out
          </span>
        </div>
      </div>

      <div class="kpi-tile" [class.success]="successRate() >= 95" [class.warning]="successRate() < 95 && successRate() >= 85" [class.error]="successRate() < 85">
        <div class="kpi-header">
          <span class="kpi-label">Success Rate</span>
          @if (successRateTrend() !== 'neutral') {
            {{ successRateTrend() === 'up' ? '↗' : '↘' }}
          }
        </div>
        <div class="kpi-value">{{ successRate().toFixed(1) }}%</div>
        <div class="kpi-detail">
          @if (summary()?.openErrors) {
            <span class="error-count">{{ summary()?.openErrors }} errors</span>
          } @else {
            <span class="success-text">All systems operational</span>
          }
        </div>
      </div>

      <div class="kpi-tile">
        <div class="kpi-header">
          <span class="kpi-label">Avg Processing</span>
          @if (processingTimeTrend() !== 'neutral') {
            {{ processingTimeTrend() === 'up' ? '↗' : '↘' }}
          }
        </div>
        <div class="kpi-value">{{ processingTimeDisplay() }}</div>
        <div class="kpi-detail">
          @if (summary()?.avgProcessingMs24h) {
            <span>{{ (summary()!.avgProcessingMs24h! / 1000).toFixed(2) }}s average</span>
          } @else {
            <span>No data available</span>
          }
        </div>
      </div>

      <div class="kpi-tile">
        <div class="kpi-header">
          <span class="kpi-label">Data Volume</span>
        </div>
        <div class="kpi-value">{{ dataVolumeDisplay() }}</div>
        <div class="kpi-breakdown">
          <span class="breakdown-item">
            {{ formatBytes(summary()?.totalBytes24h || 0) }}
          </span>
          <span class="breakdown-item">
            {{ formatBytes(summary()?.avgFileSizeBytes24h || 0) }} avg
          </span>
        </div>
      </div>

      <div class="kpi-tile" [class.success]="connectionSuccessRate() >= 95" [class.warning]="connectionSuccessRate() < 95 && connectionSuccessRate() >= 90" [class.error]="connectionSuccessRate() < 90">
        <div class="kpi-header">
          <span class="kpi-label">Connection Health</span>
        </div>
        <div class="kpi-value">{{ connectionSuccessRate().toFixed(1) }}%</div>
        <div class="kpi-detail">
          @if (connectionSuccessRate() >= 95) {
            <span class="success-text">Excellent connectivity</span>
          } @else if (connectionSuccessRate() >= 90) {
            <span class="warning-text">Minor issues detected</span>
          } @else {
            <span class="error-text">Connection problems</span>
          }
        </div>
      </div>

      <div class="kpi-tile" [class.highlight]="(summary()?.largeFileCount24h || 0) > 0">
        <div class="kpi-header">
          <span class="kpi-label">Large Files</span>
        </div>
        <div class="kpi-value">{{ summary()?.largeFileCount24h || 0 }}</div>
        <div class="kpi-detail">
          @if ((summary()?.largeFileCount24h || 0) > 0) {
            <span>Files > 10MB processed</span>
          } @else {
            <span>No large files today</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .kpi-tile {
      background: var(--white);
      border-radius: 0.75rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .kpi-tile:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .kpi-tile.success {
      border-left: 4px solid var(--success-green);
    }

    .kpi-tile.warning {
      border-left: 4px solid var(--warning-orange);
    }

    .kpi-tile.error {
      border-left: 4px solid var(--accent-coral);
    }

    .kpi-tile.highlight {
      border-left: 4px solid var(--primary-blue-gray);
    }

    .kpi-tile.trend-up {
      background: linear-gradient(135deg, rgba(40, 167, 69, 0.02) 0%, var(--white) 100%);
    }

    .kpi-tile.trend-down {
      background: linear-gradient(135deg, rgba(222, 72, 67, 0.02) 0%, var(--white) 100%);
    }

    .kpi-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .kpi-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-blue-gray);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex: 1;
    }

    .trend-icon {
      font-size: 1rem;
      opacity: 0.7;
    }

    .trend-icon.trend-up {
      color: var(--success-green);
    }

    .trend-icon.trend-down {
      color: var(--accent-coral);
    }

    .kpi-value {
      font-family: var(--font-heading);
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--primary-navy);
      line-height: 1.1;
      margin-bottom: 0.75rem;
    }

    .kpi-detail {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--medium-gray);
    }

    .kpi-breakdown {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-family: var(--font-ui);
      font-size: 0.75rem;
      color: var(--primary-blue-gray);
      font-weight: 500;
    }

    .breakdown-item mat-icon {
      font-size: 0.875rem;
      width: 0.875rem;
      height: 0.875rem;
    }

    .success-text {
      color: var(--success-green);
      font-weight: 500;
    }

    .warning-text {
      color: var(--warning-orange);
      font-weight: 500;
    }

    .error-text {
      color: var(--accent-coral);
      font-weight: 500;
    }

    .error-count {
      color: var(--accent-coral);
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .kpi-tile {
        padding: 1rem;
      }

      .kpi-value {
        font-size: 1.75rem;
      }

      .kpi-breakdown {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .kpi-header {
        flex-wrap: wrap;
      }

      .kpi-value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class KpiTilesComponent {
  @Input() summary = (): DashboardSummaryDto | null => null;
  @Input() loading = (): boolean => false;

  readonly totalFiles = computed(() => {
    const summaryData = this.summary();
    return summaryData ? summaryData.inboundFiles24h + summaryData.outboundFiles24h : 0;
  });

  readonly successRate = computed(() => {
    return this.summary()?.successRatePct || 0;
  });

  readonly connectionSuccessRate = computed(() => {
    return this.summary()?.connectionSuccessRate24h || 0;
  });

  readonly processingTimeDisplay = computed(() => {
    const summaryData = this.summary();
    if (!summaryData?.avgProcessingMs24h) return 'N/A';
    const seconds = summaryData.avgProcessingMs24h / 1000;
    if (seconds < 1) return `${summaryData.avgProcessingMs24h}ms`;
    return `${seconds.toFixed(1)}s`;
  });

  readonly dataVolumeDisplay = computed(() => {
    const summaryData = this.summary();
    return this.formatBytes(summaryData?.totalBytes24h || 0);
  });

  // Simple trend indicators (would be enhanced with historical data)
  readonly filesTrend = computed(() => {
    // In a real implementation, this would compare with previous period
    const files = this.totalFiles();
    return files > 100 ? 'up' : files < 50 ? 'down' : 'neutral';
  });

  readonly successRateTrend = computed(() => {
    const rate = this.successRate();
    return rate >= 98 ? 'up' : rate < 90 ? 'down' : 'neutral';
  });

  readonly processingTimeTrend = computed(() => {
    const summaryData = this.summary();
    const avgMs = summaryData?.avgProcessingMs24h || 0;
    return avgMs < 2000 ? 'up' : avgMs > 10000 ? 'down' : 'neutral';
  });

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}