import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuditApiService } from '../core/services/audit-api.service';
import {
  AuditSearchParams,
  AuditEventDto,
  Paged
} from '../core/models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class AuditStore {
  private readonly _events = signal<Paged<AuditEventDto> | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<AuditSearchParams>({
    page: 1,
    pageSize: 25,
    partnerId: undefined,
    operationType: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });

  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  // Computed signals
  readonly hasEvents = computed(() => {
    const events = this._events();
    return events && events.items.length > 0;
  });

  readonly totalEvents = computed(() => {
    const events = this._events();
    return events?.totalItems || 0;
  });

  readonly currentPage = computed(() => {
    const events = this._events();
    return events?.page || 1;
  });

  readonly totalPages = computed(() => {
    const events = this._events();
    return events?.totalPages || 1;
  });

  readonly hasFilters = computed(() => {
    const filters = this._filters();
    return !!(filters.partnerId || filters.operationType || 
              filters.dateFrom || filters.dateTo);
  });

  constructor(private auditApiService: AuditApiService) {}

  async search(params?: Partial<AuditSearchParams>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    // Update filters if provided
    if (params) {
      const currentFilters = this._filters();
      this._filters.set({ ...currentFilters, ...params });
    }

    try {
      const searchParams = this._filters();
      const events = await firstValueFrom(this.auditApiService.search(searchParams));
      this._events.set(events);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to search audit events');
      console.error('Error searching audit events:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    return this.search();
  }

  updateFilters(filters: Partial<AuditSearchParams>): void {
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
    const events = this._events();
    const currentPage = currentFilters.page || 1;
    if (events && currentPage < events.totalPages) {
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
      partnerId: undefined,
      operationType: undefined,
      dateFrom: undefined,
      dateTo: undefined
    });
  }

  reset(): void {
    this.clearFilters();
    this.search();
  }

  dispose(): void {
    this._events.set(null);
    this._loading.set(false);
    this._error.set(null);
    this.clearFilters();
  }
}