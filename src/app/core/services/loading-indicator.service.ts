import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingIndicatorService {
  private loadingCount = signal(0);
  
  readonly isLoading = signal(false);

  increment(): void {
    const newCount = this.loadingCount() + 1;
    this.loadingCount.set(newCount);
    this.isLoading.set(newCount > 0);
  }

  decrement(): void {
    const newCount = Math.max(0, this.loadingCount() - 1);
    this.loadingCount.set(newCount);
    this.isLoading.set(newCount > 0);
  }

  reset(): void {
    this.loadingCount.set(0);
    this.isLoading.set(false);
  }
}