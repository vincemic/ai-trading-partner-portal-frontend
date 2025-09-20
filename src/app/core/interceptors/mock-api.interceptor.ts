import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, SessionUser } from '../models/dto.models';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept when mockData is enabled
  if (!environment.mockData) {
    return next(req);
  }

  // Handle mock login endpoint
  if (req.url.includes('/api/fake-login') && req.method === 'POST') {
    const loginRequest = req.body as LoginRequest;
    
    // Simulate API delay
    const mockResponse: LoginResponse = {
      token: `mock-token-${Date.now()}`,
      user: {
        userId: loginRequest.userId,
        partnerId: loginRequest.partner,
        role: loginRequest.role
      }
    };

    return of(new HttpResponse({
      status: 200,
      body: mockResponse
    })).pipe(delay(500)); // Simulate network delay
  }

  // Handle other mock API endpoints that might be needed
  if (req.url.includes('/api/') && environment.mockData) {
    // For now, just pass through other API calls
    // They might fail, but that's okay for testing
  }

  return next(req);
};