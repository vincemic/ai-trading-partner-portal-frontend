import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FilesApiService } from '../core/services/files-api.service';
import { SseClientService } from '../core/services/sse-client.service';
import {
  FileSearchParams,
  FileEventListItemDto,
  FileEventDetailDto,
  Paged,
  SseEvent
} from '../core/models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class FilesStore {
  private readonly _files = signal<Paged<FileEventListItemDto> | null>(null);
  private readonly _selectedFile = signal<FileEventDetailDto | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<FileSearchParams>({
    page: 1,
    pageSize: 25,
    direction: undefined,
    status: undefined,
    docType: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });

  readonly files = this._files.asReadonly();
  readonly selectedFile = this._selectedFile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  // Computed signals
  readonly hasFiles = computed(() => {
    const files = this._files();
    return files && files.items.length > 0;
  });

  readonly totalFiles = computed(() => {
    const files = this._files();
    return files?.totalItems || 0;
  });

  readonly currentPage = computed(() => {
    const files = this._files();
    return files?.page || 1;
  });

  readonly totalPages = computed(() => {
    const files = this._files();
    return files?.totalPages || 1;
  });

  readonly hasFilters = computed(() => {
    const filters = this._filters();
    return !!(filters.direction || filters.status || filters.docType || 
              filters.dateFrom || filters.dateTo);
  });

  constructor(
    private filesApiService: FilesApiService,
    private sseClientService: SseClientService
  ) {
    this.setupSseSubscription();
  }

  private setupSseSubscription(): void {
    this.sseClientService.events$.subscribe((event: SseEvent) => {
      switch (event.type) {
        case 'file.created':
          this.handleFileCreated(event.data);
          break;
        case 'file.statusChanged':
          this.handleFileStatusChanged(event.data);
          break;
      }
    });
  }

  async search(params?: Partial<FileSearchParams>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    // Update filters if provided
    if (params) {
      const currentFilters = this._filters();
      this._filters.set({ ...currentFilters, ...params });
    }

    try {
      const searchParams = this._filters();
      const files = await firstValueFrom(this.filesApiService.search(searchParams));
      this._files.set(files);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to search files');
      console.error('Error searching files:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async loadFile(fileId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const file = await firstValueFrom(this.filesApiService.get(fileId));
      this._selectedFile.set(file);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load file details');
      console.error('Error loading file:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    return this.search();
  }

  updateFilters(filters: Partial<FileSearchParams>): void {
    const currentFilters = this._filters();
    // Reset to page 1 when filters change (except when explicitly setting page)
    const newFilters = { 
      ...currentFilters, 
      ...filters,
      page: filters.page !== undefined ? filters.page : 1
    };
    this._filters.set(newFilters);
  }

  nextPage(): void {
    const currentFilters = this._filters();
    const files = this._files();
    const currentPage = currentFilters.page || 1;
    if (files && currentPage < files.totalPages) {
      this.updateFilters({ page: currentPage + 1 });
      this.search();
    }
  }

  previousPage(): void {
    const currentFilters = this._filters();
    const currentPage = currentFilters.page || 1;
    if (currentPage > 1) {
      this.updateFilters({ page: currentPage - 1 });
      this.search();
    }
  }

  goToPage(page: number): void {
    this.updateFilters({ page });
    this.search();
  }

  clearFilters(): void {
    this._filters.set({
      page: 1,
      pageSize: 25,
      direction: undefined,
      status: undefined,
      docType: undefined,
      dateFrom: undefined,
      dateTo: undefined
    });
  }

  clearSelectedFile(): void {
    this._selectedFile.set(null);
  }

  private handleFileCreated(data: FileEventListItemDto): void {
    const currentFiles = this._files();
    const currentFilters = this._filters();
    
    if (currentFiles && this.fileMatchesFilters(data, currentFilters)) {
      // Add to beginning of list if on first page
      const currentPage = currentFilters.page || 1;
      const pageSize = currentFilters.pageSize || 25;
      
      if (currentPage === 1) {
        const updatedItems = [data, ...currentFiles.items];
        // Keep only the page size
        if (updatedItems.length > pageSize) {
          updatedItems.pop();
        }
        
        this._files.set({
          ...currentFiles,
          items: updatedItems,
          totalItems: currentFiles.totalItems + 1
        });
      }
    }
  }

  private handleFileStatusChanged(data: { fileId: string; status: string; processedAt?: string }): void {
    const currentFiles = this._files();
    if (currentFiles) {
      const updatedItems = currentFiles.items.map(file => 
        file.fileId === data.fileId 
          ? { 
              ...file, 
              status: data.status as any,
              processedAt: data.processedAt || file.processedAt
            }
          : file
      );
      
      this._files.set({
        ...currentFiles,
        items: updatedItems
      });
    }

    // Update selected file if it matches
    const selectedFile = this._selectedFile();
    if (selectedFile && selectedFile.fileId === data.fileId) {
      this._selectedFile.set({
        ...selectedFile,
        status: data.status as any,
        processedAt: data.processedAt || selectedFile.processedAt
      });
    }
  }

  private fileMatchesFilters(file: FileEventListItemDto, filters: FileSearchParams): boolean {
    if (filters.direction && file.direction !== filters.direction) return false;
    if (filters.status && file.status !== filters.status) return false;
    if (filters.docType && file.docType !== filters.docType) return false;
    
    if (filters.dateFrom) {
      const fileDate = new Date(file.receivedAt);
      const fromDate = new Date(filters.dateFrom);
      if (fileDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const fileDate = new Date(file.receivedAt);
      const toDate = new Date(filters.dateTo);
      if (fileDate > toDate) return false;
    }
    
    return true;
  }

  dispose(): void {
    this._files.set(null);
    this._selectedFile.set(null);
    this._loading.set(false);
    this._error.set(null);
    this.clearFilters();
  }
}