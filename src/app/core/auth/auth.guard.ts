import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait until the loading state resolves (important after Google redirect returns)
  return authService.loading$.pipe(
    filter((loading) => !loading), // wait until Firebase has resolved auth state
    take(1),
    map(() => {
      if (authService.isLoggedIn) return true;
      router.navigate(['/auth/login']);
      return false;
    })
  );
};
