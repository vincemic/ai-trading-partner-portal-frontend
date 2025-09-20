import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FileSearchParams } from '../../../core/models/dto.models';

interface FilterState {
  direction: string;
  status: string;
  docType: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

@Component({
  selector: 'app-file-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="filters-container">
      <div class="filters-header">
        <h3 class="filters-title">
          <mat-icon>filter_list</mat-icon>
          Filters
        </h3>
        <div class="filters-actions">
          <button 
            mat-button 
            color="warn" 
            (click)="clearAllFilters()"
            [disabled]="!hasActiveFilters()">
            <mat-icon>clear_all</mat-icon>
            Clear All
          </button>
          <button 
            mat-button 
            [class.expanded]="expanded()"
            (click)="toggleExpanded()">
            <mat-icon>{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ expanded() ? 'Collapse' : 'More Filters' }}
          </button>
        </div>
      </div>

      <form [formGroup]="filterForm" class="filters-form">
        <!-- Quick Filters Row -->
        <div class="quick-filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Direction</mat-label>
            <mat-select formControlName="direction" (selectionChange)="onFilterChange()">
              <mat-option value="">All Directions</mat-option>
              <mat-option value="Inbound">Inbound</mat-option>
              <mat-option value="Outbound">Outbound</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" (selectionChange)="onFilterChange()">
              <mat-option value="">All Statuses</mat-option>
              <mat-option value="Success">Success</mat-option>
              <mat-option value="Failed">Failed</mat-option>
              <mat-option value="Pending">Pending</mat-option>
              <mat-option value="Processing">Processing</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Document Type</mat-label>
            <mat-select formControlName="docType" (selectionChange)="onFilterChange()">
              <mat-option value="">All Document Types</mat-option>
              @for (docType of documentTypes(); track docType) {
                <mat-option [value]="docType">{{ docType }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Expanded Filters Section -->
        @if (expanded()) {
          <div class="expanded-filters">
            <div class="date-filters">
              <mat-form-field appearance="outline" class="filter-field date-field">
                <mat-label>From Date</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="fromPicker" 
                  formControlName="dateFrom"
                  (dateChange)="onFilterChange()"
                  readonly>
                <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field date-field">
                <mat-label>To Date</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="toPicker" 
                  formControlName="dateTo"
                  (dateChange)="onFilterChange()"
                  readonly>
                <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>

              <div class="date-shortcuts">
                <button mat-button type="button" (click)="setDateRange('today')">Today</button>
                <button mat-button type="button" (click)="setDateRange('week')">This Week</button>
                <button mat-button type="button" (click)="setDateRange('month')">This Month</button>
              </div>
            </div>
          </div>
        }
      </form>

      <!-- Active Filters Display -->
      @if (hasActiveFilters()) {
        <div class="active-filters">
          <span class="active-filters-label">Active Filters:</span>
          <mat-chip-set class="filters-chips">
            @if (filterForm.get('direction')?.value) {
              <mat-chip (removed)="removeFilter('direction')">
                Direction: {{ filterForm.get('direction')?.value }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            }
            @if (filterForm.get('status')?.value) {
              <mat-chip (removed)="removeFilter('status')">
                Status: {{ filterForm.get('status')?.value }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            }
            @if (filterForm.get('docType')?.value) {
              <mat-chip (removed)="removeFilter('docType')">
                Type: {{ filterForm.get('docType')?.value }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            }
            @if (filterForm.get('dateFrom')?.value) {
              <mat-chip (removed)="removeFilter('dateFrom')">
                From: {{ formatDate(filterForm.get('dateFrom')?.value) }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            }
            @if (filterForm.get('dateTo')?.value) {
              <mat-chip (removed)="removeFilter('dateTo')">
                To: {{ formatDate(filterForm.get('dateTo')?.value) }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-container {
      background: var(--white);
      border-radius: 0.75rem;
      border: 1px solid #E9ECEF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .filters-title {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filters-actions {
      display: flex;
      gap: 0.5rem;
    }

    .filters-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .filters-actions button.expanded {
      background: rgba(114, 123, 156, 0.1);
    }

    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .quick-filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: start;
    }

    .filter-field {
      width: 100%;
    }

    .expanded-filters {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #F8F9FA;
    }

    .date-filters {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .date-field {
      max-width: 200px;
    }

    .date-shortcuts {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .date-shortcuts button {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
    }

    .active-filters {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #F8F9FA;
    }

    .active-filters-label {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-blue-gray);
      margin-right: 0.75rem;
    }

    .filters-chips {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .filters-chips mat-chip {
      background: rgba(114, 123, 156, 0.1);
      color: var(--primary-navy);
      font-size: 0.875rem;
    }

    .filters-chips mat-chip mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    @media (max-width: 768px) {
      .filters-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .quick-filters {
        grid-template-columns: 1fr;
      }

      .filters-actions {
        width: 100%;
        justify-content: space-between;
      }

      .date-filters {
        align-items: stretch;
      }

      .date-field {
        max-width: none;
      }

      .date-shortcuts {
        justify-content: center;
      }
    }
  `]
})
export class FileFiltersComponent {
  @Input() documentTypes = (): string[] => ['EDI_850', 'EDI_855', 'EDI_856', 'EDI_810', 'XML_Invoice', 'CSV_Report'];
  @Output() filtersChanged = new EventEmitter<FileSearchParams>();

  private readonly fb = new FormBuilder();
  private readonly _expanded = signal(false);

  readonly expanded = this._expanded.asReadonly();

  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      direction: [''],
      status: [''],
      docType: [''],
      dateFrom: [null],
      dateTo: [null]
    });

    // Load persisted filters from localStorage
    this.loadPersistedFilters();
  }

  toggleExpanded(): void {
    this._expanded.update(expanded => !expanded);
  }

  hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    return !!(values.direction || values.status || values.docType || values.dateFrom || values.dateTo);
  }

  onFilterChange(): void {
    const filters = this.buildSearchParams();
    this.persistFilters(filters);
    this.filtersChanged.emit(filters);
  }

  clearAllFilters(): void {
    this.filterForm.reset();
    localStorage.removeItem('fileFilters');
    this.filtersChanged.emit({});
  }

  removeFilter(filterName: string): void {
    this.filterForm.get(filterName)?.setValue(filterName.includes('date') ? null : '');
    this.onFilterChange();
  }

  setDateRange(range: 'today' | 'week' | 'month'): void {
    const now = new Date();
    let fromDate: Date;
    const toDate = new Date(now);

    switch (range) {
      case 'today':
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate.setHours(23, 59, 59, 999);
        break;
    }

    this.filterForm.patchValue({
      dateFrom: fromDate,
      dateTo: toDate
    });

    this.onFilterChange();
  }

  formatDate(date: Date | null): string {
    return date ? date.toLocaleDateString() : '';
  }

  private buildSearchParams(): FileSearchParams {
    const values = this.filterForm.value;
    const params: FileSearchParams = {};

    if (values.direction) params.direction = values.direction;
    if (values.status) params.status = values.status;
    if (values.docType) params.docType = values.docType;
    if (values.dateFrom) params.dateFrom = values.dateFrom.toISOString();
    if (values.dateTo) params.dateTo = values.dateTo.toISOString();

    return params;
  }

  private persistFilters(filters: FileSearchParams): void {
    localStorage.setItem('fileFilters', JSON.stringify(filters));
  }

  private loadPersistedFilters(): void {
    try {
      const saved = localStorage.getItem('fileFilters');
      if (saved) {
        const filters = JSON.parse(saved);
        const formValues: any = {};

        if (filters.direction) formValues.direction = filters.direction;
        if (filters.status) formValues.status = filters.status;
        if (filters.docType) formValues.docType = filters.docType;
        if (filters.dateFrom) formValues.dateFrom = new Date(filters.dateFrom);
        if (filters.dateTo) formValues.dateTo = new Date(filters.dateTo);

        this.filterForm.patchValue(formValues);
      }
    } catch (error) {
      console.warn('Failed to load persisted filters:', error);
    }
  }
}