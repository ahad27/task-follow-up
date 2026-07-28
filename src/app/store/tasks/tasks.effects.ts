import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import * as TasksActions from './tasks.actions';
import { DatabaseService } from '../../core/services/database.service';
import { Task } from '../../core/models/task.model';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private db = inject(DatabaseService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      switchMap(() =>
        from(this.db.loadTasks()).pipe(
          map((tasks) => TasksActions.loadTasksSuccess({ tasks })),
          catchError((err) => of(TasksActions.loadTasksFailure({ error: err.message })))
        )
      )
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.createTask),
      switchMap(({ task }) => {
        const id = 'tsk-' + Date.now();
        const newTask: Task = {
          id,
          title: task.title ?? 'New Task',
          description: task.description ?? '',
          status: 'assigned',
          priority: task.priority ?? 'medium',
          category: task.category ?? 'General',
          assigneeIds: task.assigneeIds ?? [],
          createdBy: task.createdBy ?? 'usr-pm-1',
          teamId: 'team-main',
          dueDate: task.dueDate ?? new Date(),
          estimatedHours: task.estimatedHours ?? 8,
          actualHours: 0,
          progressPercent: 0,
          isBlocked: false,
          blockerReason: '',
          attachments: [],
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return from(this.db.saveTask(newTask)).pipe(
          map((saved) => TasksActions.createTaskSuccess({ task: saved })),
          catchError((err) => of(TasksActions.createTaskFailure({ error: err.message })))
        );
      })
    )
  );

  updateTaskStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTaskStatus),
      switchMap(({ id, status }) =>
        from(this.db.updateTaskStatus(id, status)).pipe(
          map(() => TasksActions.updateTaskSuccess({ task: { id, status } as Task })),
          catchError((err) => of(TasksActions.loadTasksFailure({ error: err.message })))
        )
      )
    )
  );

  updateTaskProgress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTaskProgress),
      switchMap(({ id, progressPercent }) =>
        from(this.db.updateTaskProgress(id, progressPercent)).pipe(
          map(() => TasksActions.updateTaskSuccess({ task: { id, progressPercent } as Task })),
          catchError((err) => of(TasksActions.loadTasksFailure({ error: err.message })))
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      switchMap(({ id }) =>
        from(this.db.deleteTask(id)).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError((err) => of(TasksActions.loadTasksFailure({ error: err.message })))
        )
      )
    )
  );
}
