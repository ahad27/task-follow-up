import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { filter, map, take } from 'rxjs/operators';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.loading$.pipe(
      filter((loading) => !loading),
      take(1),
      map(() => {
        const user = authService.currentUser;
        if (!user) {
          router.navigate(['/auth/login']);
          return false;
        }
        if (allowedRoles.includes(user.role)) return true;
        // Redirect to employee workspace — NOT /dashboard (which would loop back here)
        router.navigate(['/dashboard/my-workspace']);
        return false;
      })
    );
  };
};
