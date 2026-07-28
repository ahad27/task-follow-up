// Core models — Task
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'blocked'
  | 'ready_for_review'
  | 'completed'
  | 'cancelled';

export interface TaskAttachment {
  name: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assigneeIds: string[];
  createdBy: string;
  teamId: string;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  progressPercent: number;
  isBlocked: boolean;
  blockerReason: string;
  attachments: TaskAttachment[];
  tags: string[];
  parentTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date;
}

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  changedBy: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeIds?: string[];
  teamId?: string;
  isBlocked?: boolean;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  searchQuery?: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  blocked: 'Blocked',
  ready_for_review: 'Ready for Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'new', 'assigned', 'in_progress', 'on_hold', 'blocked', 'ready_for_review', 'completed', 'cancelled',
];
