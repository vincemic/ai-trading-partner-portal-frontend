import { Component, Input, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { TimeSeriesResponse } from '../../../core/models/dto.models';

@Component({
  selector: 'app-file-counts-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3 class="chart-title">{{ title }}</h3>
        <div class="chart-controls">
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color inbound"></div>
              <span>Inbound</span>
            </div>
            <div class="legend-item">
              <div class="legend-color outbound"></div>
              <span>Outbound</span>
            </div>
          </div>
        </div>
      </div>
      
      @if (loading()) {
        <div class="chart-skeleton">
          <div class="skeleton-bars">
            @for (bar of skeletonBars; track $index) {
              <div class="skeleton-bar" [style.height.%]="bar"></div>
            }
          </div>
        </div>
      } @else if (hasData()) {
        <div class="chart-wrapper">
          <div 
            echarts 
            [options]="chartOptions()" 
            [loading]="loading()"
            class="chart">
          </div>
        </div>
      } @else {
        <div class="chart-empty">
          <p>No data available for the selected time period</p>
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

    .chart-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .legend-items {
      display: flex;
      gap: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--primary-blue-gray);
      font-weight: 500;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-color.inbound {
      background: #17A2B8;
    }

    .legend-color.outbound {
      background: var(--primary-blue-gray);
    }

    .chart-wrapper {
      position: relative;
    }

    .chart {
      height: 300px;
      width: 100%;
    }

    .chart-skeleton {
      height: 300px;
      display: flex;
      align-items: end;
      padding: 1rem 0;
    }

    .skeleton-bars {
      display: flex;
      align-items: end;
      gap: 4px;
      width: 100%;
      height: 100%;
    }

    .skeleton-bar {
      flex: 1;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 2px;
      min-height: 20px;
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

    @media (max-width: 768px) {
      .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .chart {
        height: 250px;
      }

      .chart-skeleton {
        height: 250px;
      }

      .legend-items {
        gap: 0.75rem;
      }
    }
  `]
})
export class FileCountsChartComponent implements OnInit, OnDestroy {
  @Input() title = 'File Transfers (48h)';
  @Input() timeSeries = (): TimeSeriesResponse | null => null;
  @Input() loading = (): boolean => false;

  readonly skeletonBars = Array.from({ length: 24 }, () => Math.random() * 80 + 20);

  readonly hasData = computed(() => {
    const data = this.timeSeries();
    return data && data.points && data.points.length > 0;
  });

  readonly chartOptions = computed(() => {
    const timeSeries = this.timeSeries();
    if (!timeSeries?.points || timeSeries.points.length === 0) {
      return {};
    }

    const points = timeSeries.points;
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E9ECEF',
        borderWidth: 1,
        textStyle: {
          color: '#2C3E50'
        },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          
          const time = new Date(params[0].name).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          let tooltip = `<strong>${time}</strong><br/>`;
          params.forEach(param => {
            tooltip += `<span style="color: ${param.color}">●</span> ${param.seriesName}: ${param.value}<br/>`;
          });
          
          return tooltip;
        }
      },
      grid: {
        top: 20,
        bottom: 40,
        left: 40,
        right: 20,
        containLabel: true
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: '#E9ECEF'
          }
        },
        axisLabel: {
          color: '#727B9C',
          fontSize: 11,
          formatter: (value: any) => {
            const date = new Date(value);
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#F8F9FA',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'File Count',
        nameTextStyle: {
          color: '#727B9C',
          fontSize: 11
        },
        axisLine: {
          show: false
        },
        axisLabel: {
          color: '#727B9C',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#F8F9FA',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Inbound',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: points.map(p => [p.timestamp, p.inboundCount]),
          lineStyle: {
            color: '#17A2B8',
            width: 3
          },
          itemStyle: {
            color: '#17A2B8'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(23, 162, 184, 0.2)' },
                { offset: 1, color: 'rgba(23, 162, 184, 0.02)' }
              ]
            }
          }
        },
        {
          name: 'Outbound',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: points.map(p => [p.timestamp, p.outboundCount]),
          lineStyle: {
            color: '#727B9C',
            width: 3
          },
          itemStyle: {
            color: '#727B9C'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(114, 123, 156, 0.2)' },
                { offset: 1, color: 'rgba(114, 123, 156, 0.02)' }
              ]
            }
          }
        }
      ]
    } as EChartsOption;
  });

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}