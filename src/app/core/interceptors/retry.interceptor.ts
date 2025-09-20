import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Only retry idempotent GET requests and only on network errors
  if (req.method !== 'GET' || req.headers.has('X-No-Retry')) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry on network errors, not HTTP error responses
        if (error.status >= 400 && error.status < 600) {
          throw error;
        }

        // Exponential backoff: 1s, 2s
        const delayMs = Math.pow(2, retryCount - 1) * 1000;
        
        if (environment.enableLogging) {
          console.log(`Retrying request after ${delayMs}ms (attempt ${retryCount})`);
        }

        return timer(delayMs);
      }
    })
  );
};