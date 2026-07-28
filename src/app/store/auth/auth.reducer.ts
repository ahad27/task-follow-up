import { createReducer, on } from '@ngrx/store';
import { UserProfile } from '../../core/models/user.model';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, AuthActions.loginWithGoogle, AuthActions.register, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (state, { user }) => ({
    ...state, user, loading: false, error: null,
  })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),
  on(AuthActions.logoutSuccess, (state) => ({
    ...state, user: null,
  })),
  on(AuthActions.setUser, (state, { user }) => ({
    ...state, user,
  }))
);
