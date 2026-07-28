import { createAction, props } from '@ngrx/store';
import { UserProfile } from '../../core/models/user.model';

export const login = createAction('[Auth] Login', props<{ email: string; password: string }>());
export const loginWithGoogle = createAction('[Auth] Login With Google');
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: UserProfile }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

export const register = createAction('[Auth] Register', props<{ email: string; password: string; displayName: string }>());
export const registerSuccess = createAction('[Auth] Register Success', props<{ user: UserProfile }>());
export const registerFailure = createAction('[Auth] Register Failure', props<{ error: string }>());

export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

export const setUser = createAction('[Auth] Set User', props<{ user: UserProfile | null }>());
