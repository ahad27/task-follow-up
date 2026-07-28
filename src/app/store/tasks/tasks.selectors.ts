import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState, selectAll } from './tasks.reducer';
import { TaskStatus } from '../../core/models/task.model';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');
export const selectAllTasks = createSelector(selectTasksState, selectAll);
export const selectTasksLoading = createSelector(selectTasksState, (s) => s.loading);
export const selectSelectedTask = createSelector(selectTasksState, (s) => s.selectedTask);
export const selectTaskFilter = createSelector(selectTasksState, (s) => s.filter);

export const selectFilteredTasks = createSelector(selectAllTasks, selectTaskFilter, (tasks, filter) => {
  return tasks.filter((t) => {
    if (filter.status?.length && !filter.status.includes(t.status)) return false;
    if (filter.priority?.length && !filter.priority.includes(t.priority)) return false;
    if (filter.isBlocked !== undefined && t.isBlocked !== filter.isBlocked) return false;
    if (filter.assigneeIds?.length && !t.assigneeIds.some((a) => filter.assigneeIds!.includes(a))) return false;
    if (filter.teamId && t.teamId !== filter.teamId) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
});

export const selectTasksByStatus = (status: TaskStatus) =>
  createSelector(selectAllTasks, (tasks) => tasks.filter((t) => t.status === status));

export const selectBlockedTasks = createSelector(selectAllTasks, (tasks) => tasks.filter((t) => t.isBlocked));
export const selectOverdueTasks = createSelector(selectAllTasks, (tasks) =>
  tasks.filter((t) => t.dueDate < new Date() && t.status !== 'completed' && t.status !== 'cancelled')
);
export const selectCompletedToday = createSelector(selectAllTasks, (tasks) => {
  const today = new Date();
  return tasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === today.toDateString()
  );
});

export const selectDashboardMetrics = createSelector(selectAllTasks, (tasks) => ({
  total: tasks.length,
  inProgress: tasks.filter((t) => t.status === 'in_progress').length,
  blocked: tasks.filter((t) => t.isBlocked).length,
  overdue: tasks.filter((t) => t.dueDate < new Date() && !['completed', 'cancelled'].includes(t.status)).length,
  completedToday: tasks.filter((t) => {
    const today = new Date().toDateString();
    return t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === today;
  }).length,
  readyForReview: tasks.filter((t) => t.status === 'ready_for_review').length,
}));
