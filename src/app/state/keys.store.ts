import { Injectable, signal, computed } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { KeyApiService } from '../core/services/key-api.service';
import { SseClientService } from '../core/services/sse-client.service';
import {
  KeySummaryDto,
  UploadKeyRequest,
  GenerateKeyRequest,
  GenerateKeyResponse,
  RevokeKeyRequest,
  SseEvent
} from '../core/models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class KeysStore {
  private readonly _keys = signal<KeySummaryDto[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastGeneratedPrivateKey = signal<string | null>(null);

  readonly keys = this._keys.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastGeneratedPrivateKey = this._lastGeneratedPrivateKey.asReadonly();

  // Computed signals
  readonly activeKeys = computed(() => 
    this._keys().filter(key => key.status === 'Active')
  );

  readonly primaryKey = computed(() => 
    this._keys().find(key => key.isPrimary)
  );

  readonly keyCount = computed(() => this._keys().length);

  constructor(
    private keyApiService: KeyApiService,
    private sseClientService: SseClientService
  ) {
    this.setupSseSubscription();
  }

  private setupSseSubscription(): void {
    this.sseClientService.events$.subscribe((event: SseEvent) => {
      switch (event.type) {
        case 'key.promoted':
          this.handleKeyPromoted(event.data);
          break;
        case 'key.revoked':
          this.handleKeyRevoked(event.data);
          break;
      }
    });
  }

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const keys = await firstValueFrom(this.keyApiService.list());
      this._keys.set(keys);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load keys');
      console.error('Error loading keys:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    return this.load();
  }

  async upload(request: UploadKeyRequest): Promise<KeySummaryDto> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const newKey = await firstValueFrom(this.keyApiService.upload(request));
      
      // Add to existing keys or update if exists
      const currentKeys = this._keys();
      const existingIndex = currentKeys.findIndex(k => k.keyId === newKey.keyId);
      
      if (existingIndex >= 0) {
        const updatedKeys = [...currentKeys];
        updatedKeys[existingIndex] = newKey;
        this._keys.set(updatedKeys);
      } else {
        this._keys.set([...currentKeys, newKey]);
      }

      // Handle primary key changes
      if (newKey.isPrimary) {
        this.updatePrimaryKey(newKey.keyId);
      }

      return newKey;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to upload key');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async generate(request: GenerateKeyRequest): Promise<GenerateKeyResponse> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.keyApiService.generate(request));
      
      // Store the private key temporarily (it will be cleared by the component)
      this._lastGeneratedPrivateKey.set(response.privateKeyArmored);
      
      // Add new key to store
      const currentKeys = this._keys();
      this._keys.set([...currentKeys, response.key]);

      // Handle primary key changes
      if (response.key.isPrimary) {
        this.updatePrimaryKey(response.key.keyId);
      }

      return response;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to generate key');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async revoke(keyId: string, request: RevokeKeyRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.keyApiService.revoke(keyId, request));
      
      // Update key status locally
      const currentKeys = this._keys();
      const updatedKeys = currentKeys.map(key => 
        key.keyId === keyId 
          ? { ...key, status: 'Revoked' as const, isPrimary: false }
          : key
      );
      this._keys.set(updatedKeys);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to revoke key');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async promote(keyId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.keyApiService.promote(keyId));
      this.updatePrimaryKey(keyId);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to promote key');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  clearLastGeneratedPrivateKey(): void {
    this._lastGeneratedPrivateKey.set(null);
  }

  private updatePrimaryKey(newPrimaryKeyId: string): void {
    const currentKeys = this._keys();
    const updatedKeys = currentKeys.map(key => ({
      ...key,
      isPrimary: key.keyId === newPrimaryKeyId
    }));
    this._keys.set(updatedKeys);
  }

  private handleKeyPromoted(data: any): void {
    if (data.keyId) {
      this.updatePrimaryKey(data.keyId);
    }
  }

  private handleKeyRevoked(data: any): void {
    if (data.keyId) {
      const currentKeys = this._keys();
      const updatedKeys = currentKeys.map(key => 
        key.keyId === data.keyId 
          ? { ...key, status: 'Revoked' as const, isPrimary: false }
          : key
      );
      this._keys.set(updatedKeys);
    }
  }

  dispose(): void {
    this._keys.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._lastGeneratedPrivateKey.set(null);
  }
}