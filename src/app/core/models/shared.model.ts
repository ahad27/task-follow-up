// Core models — Standup, Team, Notification

export interface Standup {
  id: string;
  userId: string;
  teamId: string;
  date: string; // YYYY-MM-DD
  completed: string;
  planned: string;
  blockers: string;
  helpNeeded: string;
  progressPercent: number;
  submittedAt: Date;
  managerComment?: string;
  managerCommentBy?: string;
  isEscalated: boolean;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  leadId: string;
  managerId: string;
  memberIds: string[];
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  teamIds: string[];
}

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_commented'
  | 'standup_comment'
  | 'standup_escalated'
  | 'help_request_assigned'
  | 'help_request_resolved'
  | 'task_overdue';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityId: string;
  relatedEntityType: 'task' | 'standup' | 'help_request';
  isRead: boolean;
  createdAt: Date;
}

export interface HelpRequest {
  id: string;
  requesterId: string;
  taskId: string;
  teamId: string;
  description: string;
  status: 'open' | 'assigned' | 'resolved';
  assignedHelperId?: string;
  resolvedAt?: Date;
  createdAt: Date;
}
