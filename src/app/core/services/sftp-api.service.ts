import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SftpCredentialMetadataDto,
  RotatePasswordRequest,
  RotatePasswordResponse
} from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class SftpApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getMetadata(): Observable<SftpCredentialMetadataDto> {
    return this.http.get<SftpCredentialMetadataDto>(`${this.baseUrl}/sftp/credential`);
  }

  rotate(request: RotatePasswordRequest): Observable<RotatePasswordResponse> {
    return this.http.post<RotatePasswordResponse>(`${this.baseUrl}/sftp/credential/rotate`, request);
  }
}