import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./executive/executive-dashboard.component').then(
        (m) => m.ExecutiveDashboardComponent
      ),
    canActivate: [roleGuard(['admin', 'project_manager', 'team_lead'])],
  },
  {
    path: 'my-workspace',
    loadComponent: () =>
      import('./employee/employee-workspace.component').then(
        (m) => m.EmployeeWorkspaceComponent
      ),
  },
];
