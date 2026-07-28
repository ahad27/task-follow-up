import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Task, TaskFilter } from '../../core/models/task.model';
import * as TasksActions from './tasks.actions';

export interface TasksState extends EntityState<Task> {
  selectedTask: Task | null;
  filter: TaskFilter;
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Task> = createEntityAdapter<Task>();

const initialDemoTasks: Task[] = [
  {
    id: 'tsk-101',
    title: 'Design Dark Theme Token System & UI Components',
    description: 'Finalize global SCSS tokens, responsive grid system, and Angular Material dark theme styles.',
    status: 'completed',
    priority: 'high',
    category: 'Design',
    assigneeIds: ['usr-3'],
    createdBy: 'usr-1',
    teamId: 'team-main',
    dueDate: new Date(Date.now() - 86400000),
    estimatedHours: 12,
    actualHours: 10,
    progressPercent: 100,
    isBlocked: false,
    blockerReason: '',
    attachments: [],
    tags: ['UI/UX', 'SCSS'],
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(),
    completedAt: new Date(),
  },
  {
    id: 'tsk-102',
    title: 'Implement Auth Guards & Role-Based Navigation',
    description: 'Set up AuthGuard and RoleGuard for routes: Dashboard, Team Capacity, Admin Panel, and Reports.',
    status: 'in_progress',
    priority: 'critical',
    category: 'Development',
    assigneeIds: ['usr-1'],
    createdBy: 'usr-pm-1',
    teamId: 'team-main',
    dueDate: new Date(Date.now() + 86400000 * 2),
    estimatedHours: 16,
    actualHours: 8,
    progressPercent: 65,
    isBlocked: false,
    blockerReason: '',
    attachments: [],
    tags: ['Auth', 'Angular', 'Guards'],
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(),
  },
  {
    id: 'tsk-103',
    title: 'Staging Environment Auth Token Expiration Fix',
    description: 'Fix auth token expiration issues during API calls in staging environment.',
    status: 'blocked',
    priority: 'critical',
    category: 'Infrastructure',
    assigneeIds: ['usr-5'],
    createdBy: 'usr-pm-1',
    teamId: 'team-main',
    dueDate: new Date(Date.now() + 86400000),
    estimatedHours: 8,
    actualHours: 4,
    progressPercent: 30,
    isBlocked: true,
    blockerReason: 'Waiting for DevOps deployment credentials on staging server.',
    attachments: [],
    tags: ['DevOps', 'Staging', 'Blocker'],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'tsk-104',
    title: 'Automate CI/CD Regression Pipeline in GitHub Actions',
    description: 'Configure automated unit testing and end-to-end regression test triggers on main branch push.',
    status: 'in_progress',
    priority: 'high',
    category: 'QA & Testing',
    assigneeIds: ['usr-4'],
    createdBy: 'usr-pm-1',
    teamId: 'team-main',
    dueDate: new Date(Date.now() + 86400000 * 4),
    estimatedHours: 20,
    actualHours: 10,
    progressPercent: 50,
    isBlocked: false,
    blockerReason: '',
    attachments: [],
    tags: ['CI/CD', 'QA', 'Automation'],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'tsk-105',
    title: 'Drag-and-Drop Task Status State Handler',
    description: 'Implement drag-and-drop state management for Kanban board columns.',
    status: 'assigned',
    priority: 'medium',
    category: 'Development',
    assigneeIds: ['usr-2'],
    createdBy: 'usr-pm-1',
    teamId: 'team-main',
    dueDate: new Date(Date.now() + 86400000 * 5),
    estimatedHours: 14,
    actualHours: 0,
    progressPercent: 0,
    isBlocked: false,
    blockerReason: '',
    attachments: [],
    tags: ['Frontend', 'Kanban'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const baseState: TasksState = adapter.getInitialState({
  selectedTask: null,
  filter: {},
  loading: false,
  error: null,
});

const initialState: TasksState = adapter.setAll(initialDemoTasks, baseState);

export const tasksReducer = createReducer(
  initialState,
  on(TasksActions.loadTasks, (state) => ({ ...state, loading: false })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => {
    if (!tasks || tasks.length === 0) return state; // Keep initial tasks if backend is offline
    return adapter.setAll(tasks, { ...state, loading: false });
  }),
  on(TasksActions.loadTasksFailure, (state) => ({ ...state, loading: false })),

  on(TasksActions.createTask, (state, { task }) => {
    const newTask: Task = {
      id: 'tsk-' + Date.now(),
      title: task.title || 'New Task',
      description: task.description || '',
      status: 'assigned',
      priority: task.priority || 'medium',
      category: task.category || 'General',
      assigneeIds: task.assigneeIds || [],
      createdBy: task.createdBy || 'usr-pm-1',
      teamId: 'team-main',
      dueDate: task.dueDate || new Date(),
      estimatedHours: task.estimatedHours || 8,
      actualHours: 0,
      progressPercent: 0,
      isBlocked: false,
      blockerReason: '',
      attachments: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return adapter.addOne(newTask, state);
  }),

  on(TasksActions.createTaskSuccess, (state, { task }) => adapter.upsertOne(task, state)),

  on(TasksActions.updateTaskStatus, (state, { id, status }) => {
    const existing = state.entities[id];
    if (!existing) return state;
    const isCompleted = status === 'completed';
    const isBlocked = status === 'blocked';
    const updated: Task = {
      ...existing,
      status,
      progressPercent: isCompleted ? 100 : existing.progressPercent,
      isBlocked: isBlocked ? true : existing.isBlocked,
      completedAt: isCompleted ? new Date() : existing.completedAt,
      updatedAt: new Date(),
    };
    return adapter.updateOne({ id, changes: updated }, state);
  }),

  on(TasksActions.updateTaskProgress, (state, { id, progressPercent }) => {
    const existing = state.entities[id];
    if (!existing) return state;
    const isCompleted = progressPercent === 100;
    const updated: Task = {
      ...existing,
      progressPercent,
      status: isCompleted ? 'completed' : existing.status,
      completedAt: isCompleted ? new Date() : existing.completedAt,
      updatedAt: new Date(),
    };
    return adapter.updateOne({ id, changes: updated }, state);
  }),

  on(TasksActions.updateTaskSuccess, (state, { task }) => adapter.upsertOne(task, state)),
  on(TasksActions.deleteTaskSuccess, (state, { id }) => adapter.removeOne(id, state)),

  on(TasksActions.selectTask, (state, { task }) => ({ ...state, selectedTask: task })),
  on(TasksActions.setFilter, (state, { filter }) => ({ ...state, filter })),
  on(TasksActions.clearFilter, (state) => ({ ...state, filter: {} })),
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
