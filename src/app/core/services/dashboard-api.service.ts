import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  ZeroFileWindowStatusDto
} from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(`${this.baseUrl}/dashboard/summary`);
  }

  getTimeSeries(params: { from: string; to: string }): Observable<TimeSeriesResponse> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<TimeSeriesResponse>(`${this.baseUrl}/dashboard/timeseries`, { params: httpParams });
  }

  getTopErrors(params: { from: string; to: string }): Observable<TopErrorsResponse> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<TopErrorsResponse>(`${this.baseUrl}/dashboard/errors/top`, { params: httpParams });
  }

  getConnectionHealth(params: { from: string; to: string }): Observable<ConnectionHealthPointDto[]> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<ConnectionHealthPointDto[]>(`${this.baseUrl}/dashboard/connection-health`, { params: httpParams });
  }

  getConnectionStatus(): Observable<ConnectionCurrentStatusDto> {
    return this.http.get<ConnectionCurrentStatusDto>(`${this.baseUrl}/dashboard/connection-status`);
  }

  getThroughput(params: { from: string; to: string }): Observable<ThroughputPointDto[]> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<ThroughputPointDto[]>(`${this.baseUrl}/dashboard/throughput`, { params: httpParams });
  }

  getLargeFiles(params: { from: string; to: string; limit?: number }): Observable<LargeFileDto[]> {
    const httpParams = new HttpParams({ fromObject: this.serializeParams(params) });
    return this.http.get<LargeFileDto[]>(`${this.baseUrl}/dashboard/large-files`, { params: httpParams });
  }

  getConnectionPerformance(params: { from: string; to: string }): Observable<ConnectionPerformancePointDto[]> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<ConnectionPerformancePointDto[]>(`${this.baseUrl}/dashboard/connection-performance`, { params: httpParams });
  }

  getDailySummary(params: { days: number }): Observable<DailyOpsPointDto[]> {
    const httpParams = new HttpParams({ fromObject: this.serializeParams(params) });
    return this.http.get<DailyOpsPointDto[]>(`${this.baseUrl}/dashboard/daily-summary`, { params: httpParams });
  }

  getFailureBursts(params: { lookbackMinutes: number }): Observable<FailureBurstPointDto[]> {
    const httpParams = new HttpParams({ fromObject: this.serializeParams(params) });
    return this.http.get<FailureBurstPointDto[]>(`${this.baseUrl}/dashboard/failure-bursts`, { params: httpParams });
  }

  getZeroFileWindow(params: { windowHours: number }): Observable<ZeroFileWindowStatusDto> {
    const httpParams = new HttpParams({ fromObject: this.serializeParams(params) });
    return this.http.get<ZeroFileWindowStatusDto>(`${this.baseUrl}/dashboard/zero-file-window`, { params: httpParams });
  }

  private serializeParams(params: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        result[key] = String(value);
      }
    }
    return result;
  }
}