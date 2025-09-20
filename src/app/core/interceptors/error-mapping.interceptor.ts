import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { PortalError } from '../models/dto.models';

export const errorMappingInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let portalError: PortalError;

      if (error.status === 401 || error.status === 440) {
        // Handle unauthorized/session timeout
        sessionService.handleUnauthorized();
        portalError = {
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please log in again.',
          traceId: error.headers.get('trace-id') || undefined
        };
      } else if (error.error?.error) {
        // Backend returned structured error
        portalError = {
          code: error.error.error.code || 'UNKNOWN_ERROR',
          message: error.error.error.message || 'An unexpected error occurred',
          traceId: error.error.error.traceId || error.headers.get('trace-id') || undefined,
          userMessage: mapErrorCodeToUserMessage(error.error.error.code)
        };
      } else {
        // Generic HTTP error
        portalError = {
          code: `HTTP_${error.status}`,
          message: error.message || 'An unexpected error occurred',
          traceId: error.headers.get('trace-id') || undefined,
          userMessage: getGenericErrorMessage(error.status)
        };
      }

      return throwError(() => portalError);
    })
  );
};

function mapErrorCodeToUserMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'KEY_CONFLICT': 'A key with this fingerprint already exists',
    'KEY_NOT_FOUND': 'The requested key was not found',
    'INVALID_KEY_FORMAT': 'The provided key format is invalid',
    'PASSWORD_TOO_WEAK': 'Password does not meet complexity requirements',
    'PARTNER_NOT_FOUND': 'Partner not found',
    'INVALID_CREDENTIALS': 'Invalid login credentials',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
    'FILE_NOT_FOUND': 'The requested file was not found',
    'VALIDATION_ERROR': 'Please check your input and try again'
  };

  return errorMessages[code] || 'An unexpected error occurred';
}

function getGenericErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'A server error occurred. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}