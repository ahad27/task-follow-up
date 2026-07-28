import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then(
        (m) => m.AppShellComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.dashboardRoutes
          ),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks.routes').then((m) => m.taskRoutes),
      },
      {
        path: 'daily-followup',
        loadChildren: () =>
          import('./features/daily-followup/followup.routes').then(
            (m) => m.followupRoutes
          ),
      },
      {
        path: 'team-capacity',
        loadComponent: () =>
          import('./features/team-capacity/team-capacity.component').then(
            (m) => m.TeamCapacityComponent
          ),
        canActivate: [roleGuard(['admin', 'project_manager', 'team_lead'])],
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./features/help-escalation/help-escalation.component').then(
            (m) => m.HelpEscalationComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
        canActivate: [roleGuard(['admin', 'project_manager', 'team_lead'])],
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
        canActivate: [roleGuard(['admin'])],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
