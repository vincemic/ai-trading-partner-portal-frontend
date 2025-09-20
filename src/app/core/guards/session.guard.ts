import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const sessionGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (sessionService.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};