import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VersionInfo, HealthStatus } from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class SystemApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  version(): Observable<VersionInfo> {
    return this.http.get<VersionInfo>(`${this.baseUrl}/version`);
  }

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.baseUrl}/health`);
  }
}