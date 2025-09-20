import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DashboardSummaryDto } from '../../../core/models/dto.models';

@Component({
  selector: 'app-success-ratio-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3 class="chart-title">{{ title }}</h3>
        <div class="chart-summary">
          <span class="success-rate" [class]="getSuccessRateClass()">
            {{ successRate().toFixed(1) }}%
          </span>
        </div>
      </div>
      
      @if (loading()) {
        <div class="chart-skeleton">
          <div class="skeleton-circle"></div>
          <div class="skeleton-legend">
            <div class="skeleton-legend-item"></div>
            <div class="skeleton-legend-item"></div>
            <div class="skeleton-legend-item"></div>
          </div>
        </div>
      } @else if (hasData()) {
        <div class="chart-wrapper">
          <div 
            echarts 
            [options]="chartOptions()" 
            class="chart">
          </div>
          <div class="chart-center-text">
            <div class="total-files">{{ totalFiles() }}</div>
            <div class="total-label">Total Files</div>
          </div>
        </div>
        
        <div class="statistics">
          <div class="stat-item success">
            <div class="stat-value">{{ successfulFiles() }}</div>
            <div class="stat-label">Successful</div>
          </div>
          <div class="stat-item failed">
            <div class="stat-value">{{ failedFiles() }}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat-item pending">
            <div class="stat-value">{{ pendingFiles() }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
      } @else {
        <div class="chart-empty">
          <p>No data available</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      background: var(--white);
      border-radius: 0.75rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      transition: box-shadow 0.3s ease;
    }

    .chart-container:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .chart-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin: 0;
    }

    .chart-summary {
      display: flex;
      align-items: center;
    }

    .success-rate {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
    }

    .success-rate.excellent {
      color: var(--success-green);
    }

    .success-rate.good {
      color: #17A2B8;
    }

    .success-rate.warning {
      color: var(--warning-orange);
    }

    .success-rate.poor {
      color: var(--accent-coral);
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
    }

    .chart {
      height: 100%;
      width: 100%;
    }

    .chart-center-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
    }

    .total-files {
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-navy);
      line-height: 1;
    }

    .total-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .chart-skeleton {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }

    .skeleton-circle {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    .skeleton-legend {
      display: flex;
      gap: 2rem;
    }

    .skeleton-legend-item {
      width: 80px;
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .chart-empty {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-blue-gray);
      font-style: italic;
    }

    .statistics {
      display: flex;
      justify-content: space-around;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #F8F9FA;
    }

    .stat-item {
      text-align: center;
      flex: 1;
    }

    .stat-value {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-item.success .stat-value {
      color: var(--success-green);
    }

    .stat-item.success .stat-label {
      color: var(--success-green);
    }

    .stat-item.failed .stat-value {
      color: var(--accent-coral);
    }

    .stat-item.failed .stat-label {
      color: var(--accent-coral);
    }

    .stat-item.pending .stat-value {
      color: var(--warning-orange);
    }

    .stat-item.pending .stat-label {
      color: var(--warning-orange);
    }

    @media (max-width: 768px) {
      .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .chart-wrapper {
        height: 250px;
      }

      .total-files {
        font-size: 1.5rem;
      }

      .statistics {
        flex-direction: column;
        gap: 1rem;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        text-align: left;
      }

      .stat-value {
        font-size: 1.25rem;
      }
    }
  `]
})
export class SuccessRatioChartComponent {
  @Input() title = 'Success Rate Distribution';
  @Input() summary = (): DashboardSummaryDto | null => null;
  @Input() loading = (): boolean => false;

  readonly hasData = computed(() => {
    const summaryData = this.summary();
    return summaryData && this.totalFiles() > 0;
  });

  readonly totalFiles = computed(() => {
    const summaryData = this.summary();
    return summaryData ? summaryData.inboundFiles24h + summaryData.outboundFiles24h : 0;
  });

  readonly successRate = computed(() => {
    return this.summary()?.successRatePct || 0;
  });

  readonly successfulFiles = computed(() => {
    const total = this.totalFiles();
    const rate = this.successRate();
    return Math.round(total * rate / 100);
  });

  readonly failedFiles = computed(() => {
    return this.summary()?.openErrors || 0;
  });

  readonly pendingFiles = computed(() => {
    const total = this.totalFiles();
    const successful = this.successfulFiles();
    const failed = this.failedFiles();
    return Math.max(0, total - successful - failed);
  });

  readonly chartOptions = computed(() => {
    if (!this.hasData()) {
      return {};
    }

    const successful = this.successfulFiles();
    const failed = this.failedFiles();
    const pending = this.pendingFiles();

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E9ECEF',
        borderWidth: 1,
        textStyle: {
          color: '#2C3E50'
        },
        formatter: (params: any) => {
          return `<strong>${params.name}</strong><br/>Count: ${params.value}<br/>Percentage: ${params.percent.toFixed(1)}%`;
        }
      },
      legend: {
        show: false
      },
      series: [
        {
          name: 'File Status',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          data: [
            {
              value: successful,
              name: 'Successful',
              itemStyle: {
                color: '#28A745'
              }
            },
            {
              value: failed,
              name: 'Failed',
              itemStyle: {
                color: '#DE4843'
              }
            },
            {
              value: pending,
              name: 'Pending',
              itemStyle: {
                color: '#FFC107'
              }
            }
          ].filter(item => item.value > 0),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    } as EChartsOption;
  });

  getSuccessRateClass(): string {
    const rate = this.successRate();
    if (rate >= 98) return 'excellent';
    if (rate >= 95) return 'good';
    if (rate >= 85) return 'warning';
    return 'poor';
  }
}