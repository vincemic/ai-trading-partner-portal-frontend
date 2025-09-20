import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FileSearchParams,
  FileEventListItemDto,
  FileEventDetailDto,
  Paged
} from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class FilesApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  search(params: FileSearchParams): Observable<Paged<FileEventListItemDto>> {
    const httpParams = new HttpParams({ fromObject: this.serializeParams(params) });
    return this.http.get<Paged<FileEventListItemDto>>(`${this.baseUrl}/files`, { params: httpParams });
  }

  get(fileId: string): Observable<FileEventDetailDto> {
    return this.http.get<FileEventDetailDto>(`${this.baseUrl}/files/${fileId}`);
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