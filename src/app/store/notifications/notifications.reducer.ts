import { createReducer } from '@ngrx/store';
import { AppNotification } from '../../core/models/shared.model';

export interface NotificationsState {
  items: AppNotification[];
  loading: boolean;
}

const initialState: NotificationsState = { items: [], loading: false };
export const notificationsReducer = createReducer(initialState);
