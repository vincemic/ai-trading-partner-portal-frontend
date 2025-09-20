import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { sessionTokenInterceptor } from './core/interceptors/session-token.interceptor';
import { errorMappingInterceptor } from './core/interceptors/error-mapping.interceptor';
import { loadingIndicatorInterceptor } from './core/interceptors/loading-indicator.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        mockApiInterceptor,
        sessionTokenInterceptor,
        errorMappingInterceptor,
        loadingIndicatorInterceptor,
        retryInterceptor
      ])
    ),
    provideAnimations()
  ]
};
