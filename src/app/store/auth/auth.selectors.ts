import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectCurrentUser = createSelector(selectAuthState, (s) => s.user);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectUserRole = createSelector(selectCurrentUser, (u) => u?.role ?? null);
export const selectIsAdmin = createSelector(selectUserRole, (r) => r === 'admin');
export const selectIsManager = createSelector(selectUserRole, (r) => r === 'admin' || r === 'project_manager');
export const selectIsLead = createSelector(selectUserRole, (r) => ['admin', 'project_manager', 'team_lead'].includes(r ?? ''));
