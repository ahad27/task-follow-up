import { createAction, props } from '@ngrx/store';
import { Task, TaskFilter, TaskStatus } from '../../core/models/task.model';

export const loadTasks = createAction('[Tasks] Load Tasks', props<{ filter?: TaskFilter }>());
export const loadTasksSuccess = createAction('[Tasks] Load Tasks Success', props<{ tasks: Task[] }>());
export const loadTasksFailure = createAction('[Tasks] Load Tasks Failure', props<{ error: string }>());

export const createTask = createAction('[Tasks] Create Task', props<{ task: Partial<Task> }>());
export const createTaskSuccess = createAction('[Tasks] Create Task Success', props<{ task: Task }>());
export const createTaskFailure = createAction('[Tasks] Create Task Failure', props<{ error: string }>());

export const updateTask = createAction('[Tasks] Update Task', props<{ id: string; changes: Partial<Task> }>());
export const updateTaskSuccess = createAction('[Tasks] Update Task Success', props<{ task: Task }>());

export const updateTaskStatus = createAction('[Tasks] Update Status', props<{ id: string; status: TaskStatus }>());
export const updateTaskProgress = createAction('[Tasks] Update Progress', props<{ id: string; progressPercent: number }>());

export const deleteTask = createAction('[Tasks] Delete Task', props<{ id: string }>());
export const deleteTaskSuccess = createAction('[Tasks] Delete Task Success', props<{ id: string }>());

export const selectTask = createAction('[Tasks] Select Task', props<{ task: Task | null }>());
export const setFilter = createAction('[Tasks] Set Filter', props<{ filter: TaskFilter }>());
export const clearFilter = createAction('[Tasks] Clear Filter');
