import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditSearchParams,
  AuditEventDto,
  Paged
} from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class AuditApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  search(params: AuditSearchParams): Observable<Paged<AuditEventDto>> {
    const httpParams = new HttpParams({ fromObject: this.serializeParams(params) });
    return this.http.get<Paged<AuditEventDto>>(`${this.baseUrl}/audit`, { params: httpParams });
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