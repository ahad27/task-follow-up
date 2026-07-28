import { createReducer, on } from '@ngrx/store';
import { UserProfile, CapacityData } from '../../core/models/user.model';

export interface UsersState {
  teamMembers: UserProfile[];
  capacityMap: Record<string, CapacityData>;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  teamMembers: [],
  capacityMap: {},
  loading: false,
  error: null,
};

export const usersReducer = createReducer(initialState);
