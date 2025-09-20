import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStore } from '../../state/dashboard.store';
import { KpiTilesComponent } from './components/kpi-tiles.component';
import { FileCountsChartComponent } from './components/file-counts-chart.component';
import { SuccessRatioChartComponent } from './components/success-ratio-chart.component';
import { TopErrorsTableComponent } from './components/top-errors-table.component';
import { AdvancedMetricsPanelComponent } from './components/advanced-metrics-panel.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    KpiTilesComponent,
    FileCountsChartComponent,
    SuccessRatioChartComponent,
    TopErrorsTableComponent,
    AdvancedMetricsPanelComponent
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Overview of your EDI operations and metrics</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button type="button" class="btn-primary" (click)="refresh()">
            Try Again
          </button>
        </div>
      } @else {
        <!-- KPI Tiles -->
        <app-kpi-tiles 
          [summary]="summary"
          [loading]="loading">
        </app-kpi-tiles>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <div class="chart-item">
            <app-file-counts-chart
              [timeSeries]="timeSeries"
              [loading]="loading"
              title="File Transfers (48h)">
            </app-file-counts-chart>
          </div>

          <div class="chart-item">
            <app-success-ratio-chart
              [summary]="summary"
              [loading]="loading"
              title="Success Rate Distribution">
            </app-success-ratio-chart>
          </div>
        </div>

        <!-- Top Errors Table -->
        <app-top-errors-table
          [topErrors]="topErrors"
          [totalFiles]="totalFilesToday"
          [loading]="loading"
          (errorClicked)="onErrorClicked($event)"
          (filterByError)="onFilterByError($event)"
          (viewAllErrors)="onViewAllErrors()">
        </app-top-errors-table>

        <!-- Advanced Metrics Panel -->
        <app-advanced-metrics-panel
          [connectionHealth]="connectionHealth"
          [connectionStatus]="connectionStatus"
          [throughput]="throughput"
          [largeFiles]="largeFiles"
          [connectionPerformance]="connectionPerformance"
          [dailySummary]="dailySummary"
          [failureBursts]="failureBursts"
          [zeroFileWindow]="zeroFileWindow"
          [loading]="loading"
          [onLoadAdvanced]="loadAdvancedMetrics.bind(this)">
        </app-advanced-metrics-panel>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 100%;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-family: var(--font-heading);
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      font-family: var(--font-body);
      font-size: 1.125rem;
      color: var(--primary-blue-gray);
      margin: 0;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
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

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-item {
      min-height: 400px;
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 2rem;
      }

      .charts-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .chart-item {
        min-height: 300px;
      }
    }
  `]
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  constructor(private dashboardStore: DashboardStore) {}

  get loading() {
    return this.dashboardStore.loading;
  }

  get error() {
    return this.dashboardStore.error;
  }

  get summary() {
    return this.dashboardStore.summary;
  }

  get timeSeries() {
    return this.dashboardStore.timeSeries;
  }

  get topErrors() {
    return this.dashboardStore.topErrors;
  }

  get connectionHealth() {
    return this.dashboardStore.connectionHealth;
  }

  get connectionStatus() {
    return this.dashboardStore.connectionStatus;
  }

  get throughput() {
    return this.dashboardStore.throughput;
  }

  get largeFiles() {
    return this.dashboardStore.largeFiles;
  }

  get connectionPerformance() {
    return this.dashboardStore.connectionPerformance;
  }

  get dailySummary() {
    return this.dashboardStore.dailySummary;
  }

  get failureBursts() {
    return this.dashboardStore.failureBursts;
  }

  get zeroFileWindow() {
    return this.dashboardStore.zeroFileWindow;
  }

  get successRateDisplay() {
    return this.dashboardStore.successRateDisplay;
  }

  get totalFilesToday() {
    return this.dashboardStore.totalFilesToday;
  }

  get avgProcessingTimeDisplay() {
    return this.dashboardStore.avgProcessingTimeDisplay;
  }

  async ngOnInit(): Promise<void> {
    await this.dashboardStore.load();
  }

  ngOnDestroy(): void {
    // Optional cleanup if needed
  }

  async refresh(): Promise<void> {
    await this.dashboardStore.refresh();
  }

  async loadAdvancedMetrics(): Promise<void> {
    await this.dashboardStore.loadAdvancedMetrics();
  }

  onErrorClicked(category: string): void {
    console.log('Error category clicked:', category);
    // Navigate to files page with error filter
  }

  onFilterByError(category: string): void {
    console.log('Filter by error:', category);
    // Apply error filter to files view
  }

  onViewAllErrors(): void {
    console.log('View all errors clicked');
    // Navigate to errors/audit page
  }
}