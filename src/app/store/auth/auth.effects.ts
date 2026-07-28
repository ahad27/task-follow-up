import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '../../core/auth/auth.service';
import * as AuthActions from './auth.actions';
import { EMPTY, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        from(this.authService.loginWithEmail(email, password)).pipe(
          map((user) => AuthActions.loginSuccess({ user })),
          catchError((err) => of(AuthActions.loginFailure({ error: err.message })))
        )
      )
    )
  );

  loginWithGoogle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginWithGoogle),
      switchMap(() =>
        // signInWithRedirect navigates the page to Google — no return value here.
        // Auth state is handled by onAuthStateChanged when the page returns from redirect.
        from(this.authService.loginWithGoogle()).pipe(
          switchMap(() => EMPTY),
          catchError((err) => of(AuthActions.loginFailure({ error: err.message })))
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ email, password, displayName }) =>
        from(this.authService.register(email, password, displayName)).pipe(
          map((user) => AuthActions.registerSuccess({ user })),
          catchError((err) => of(AuthActions.registerFailure({ error: err.message })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
        tap(({ user }) => {
          // Route managers/admins/leads to the executive dashboard;
          // all other roles (employees) go to their personal workspace.
          const isLead = ['admin', 'project_manager', 'team_lead'].includes(user.role);
          this.router.navigate([isLead ? '/dashboard' : '/dashboard/my-workspace']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        from(this.authService.logout()).pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess()))
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/auth/login']))
      ),
    { dispatch: false }
  );
}
