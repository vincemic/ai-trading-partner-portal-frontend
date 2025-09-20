import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SessionService } from '../services/session.service';

export const sessionTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const token = sessionService.getToken();

  if (token && !req.headers.has('X-Session-Token')) {
    const authReq = req.clone({
      headers: req.headers.set('X-Session-Token', token)
    });
    return next(authReq);
  }

  return next(req);
};