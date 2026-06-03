import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        storageService.clear();
        router.navigate(['/auth/login']);
      }

      // Handle other errors
      const errorMessage =
        error.error?.message || error.message || 'An error occurred';

      console.error('HTTP Error:', errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
