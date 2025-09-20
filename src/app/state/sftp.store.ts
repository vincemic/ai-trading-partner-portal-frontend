import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SftpApiService } from '../core/services/sftp-api.service';
import {
  SftpCredentialMetadataDto,
  RotatePasswordRequest,
  RotatePasswordResponse
} from '../core/models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class SftpStore {
  private readonly _metadata = signal<SftpCredentialMetadataDto | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastGeneratedPassword = signal<string | null>(null);

  readonly metadata = this._metadata.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastGeneratedPassword = this._lastGeneratedPassword.asReadonly();

  constructor(private sftpApiService: SftpApiService) {}

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const metadata = await firstValueFrom(this.sftpApiService.getMetadata());
      this._metadata.set(metadata);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load SFTP metadata');
      console.error('Error loading SFTP metadata:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    return this.load();
  }

  async rotate(request: RotatePasswordRequest): Promise<RotatePasswordResponse> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.sftpApiService.rotate(request));
      
      // Store generated password temporarily (if auto mode)
      if (response.password) {
        this._lastGeneratedPassword.set(response.password);
      }
      
      // Update metadata
      this._metadata.set(response.metadata);

      return response;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to rotate password');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  clearLastGeneratedPassword(): void {
    this._lastGeneratedPassword.set(null);
  }

  dispose(): void {
    this._metadata.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._lastGeneratedPassword.set(null);
  }
}