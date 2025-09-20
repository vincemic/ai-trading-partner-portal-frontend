import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoadingIndicatorService } from '../services/loading-indicator.service';

export const loadingIndicatorInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingIndicatorService);
  
  // Skip loading indicator for certain requests
  if (req.headers.has('X-Skip-Loading')) {
    return next(req);
  }

  loadingService.increment();

  return next(req).pipe(
    finalize(() => {
      loadingService.decrement();
    })
  );
};