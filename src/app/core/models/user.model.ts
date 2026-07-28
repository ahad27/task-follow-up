// Core models — User
export type UserRole = 'admin' | 'project_manager' | 'team_lead' | 'employee';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  teamId: string | null;
  departmentId: string | null;
  isActive: boolean;
  capacity: number; // max active tasks per day, default 5
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacityData {
  userId: string;
  totalTasks: number;
  completedToday: number;
  inProgressTasks: number;
  blockedTasks: number;
  utilizationPercent: number;
  isOverloaded: boolean;
}
