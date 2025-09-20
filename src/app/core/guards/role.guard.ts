import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SessionService } from '../services/session.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (sessionService.hasRole(requiredRoles)) {
    return true;
  }

  // User doesn't have required role, redirect to forbidden or dashboard
  router.navigate(['/dashboard'], {
    queryParams: { message: 'You do not have permission to access this page.' }
  });
  return false;
};