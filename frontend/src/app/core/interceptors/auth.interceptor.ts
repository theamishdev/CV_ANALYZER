import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Simple pass-through interceptor for logging/future token headers
  console.log(`HTTP Request intercepted: ${req.method} ${req.url}`);
  return next(req);
};
