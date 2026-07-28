import { Routes } from '@angular/router';

export const taskRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./task-board/task-board.component').then((m) => m.TaskBoardComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
  },
];
