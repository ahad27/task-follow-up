import { Routes } from '@angular/router';

export const followupRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./standup-review/standup-review.component').then(
        (m) => m.StandupReviewComponent
      ),
  },
];
