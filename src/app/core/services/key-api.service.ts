import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  KeySummaryDto,
  UploadKeyRequest,
  GenerateKeyRequest,
  GenerateKeyResponse,
  RevokeKeyRequest
} from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class KeyApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<KeySummaryDto[]> {
    return this.http.get<KeySummaryDto[]>(`${this.baseUrl}/keys`);
  }

  upload(request: UploadKeyRequest): Observable<KeySummaryDto> {
    return this.http.post<KeySummaryDto>(`${this.baseUrl}/keys/upload`, request);
  }

  generate(request: GenerateKeyRequest): Observable<GenerateKeyResponse> {
    return this.http.post<GenerateKeyResponse>(`${this.baseUrl}/keys/generate`, request);
  }

  revoke(keyId: string, request: RevokeKeyRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/keys/${keyId}/revoke`, request);
  }

  promote(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/keys/${keyId}/promote`, {});
  }
}