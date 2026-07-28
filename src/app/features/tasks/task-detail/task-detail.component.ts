import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { selectAllTasks } from '../../../store/tasks/tasks.selectors';
import { updateTaskStatus, updateTaskProgress } from '../../../store/tasks/tasks.actions';
import { Task, TaskStatus, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from '../../../core/models/task.model';
import { selectIsManager } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="task-detail animate-fade-in" *ngIf="task(); else notFound">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/tasks">Tasks</a>
        <span class="material-icons-round">chevron_right</span>
        <span>{{ task()!.title }}</span>
      </div>

      <div class="detail-grid">
        <!-- Main -->
        <div class="detail-main">
          <div class="card">
            <div class="detail-header">
              <div class="detail-badges">
                <span class="badge badge--{{ task()!.priority }}">{{ task()!.priority }}</span>
                <span class="badge badge--{{ task()!.status.replace('_','-') }}">{{ getStatusLabel(task()!.status) }}</span>
                @if (task()!.isBlocked) {
                  <span class="badge badge--blocked">Blocked</span>
                }
              </div>
              @if (isManager()) {
                <div class="detail-actions">
                  <select class="status-select" [value]="task()!.status" (change)="onStatusChange($event)">
                    @for (s of statusOptions; track s) {
                      <option [value]="s">{{ getStatusLabel(s) }}</option>
                    }
                  </select>
                </div>
              }
            </div>

            <h1 class="detail-title">{{ task()!.title }}</h1>
            <p class="detail-desc text-secondary">{{ task()!.description || 'No description provided.' }}</p>

            <!-- Progress -->
            <div class="progress-section">
              <div class="progress-header">
                <span>Progress</span>
                <strong>{{ task()!.progressPercent }}%</strong>
              </div>
              <div class="progress-bar progress-bar--lg">
                <div class="progress-bar__fill" [style.width.%]="task()!.progressPercent"></div>
              </div>
              @if (isManager()) {
                <input type="range" min="0" max="100" step="5"
                  [value]="task()!.progressPercent"
                  (change)="onProgressChange($event)"
                  class="progress-slider" />
              }
            </div>

            @if (task()!.blockerReason) {
              <div class="blocker-box">
                <span class="material-icons-round">block</span>
                <div>
                  <strong>Blocked</strong>
                  <p>{{ task()!.blockerReason }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Comments placeholder -->
          <div class="card comments-card">
            <h3>Comments</h3>
            <div class="empty-state">
              <span class="material-icons-round">chat_bubble_outline</span>
              <p>No comments yet. Be the first to comment.</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="detail-sidebar">
          <div class="card info-card">
            <h4>Task Info</h4>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Due Date</span>
                <span [class.text-danger]="isOverdue()">{{ task()!.dueDate | date:'MMM dd, yyyy' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estimated</span>
                <span>{{ task()!.estimatedHours }}h</span>
              </div>
              <div class="info-row">
                <span class="info-label">Actual</span>
                <span>{{ task()!.actualHours }}h</span>
              </div>
              <div class="info-row">
                <span class="info-label">Category</span>
                <span>{{ task()!.category || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Created</span>
                <span>{{ task()!.createdAt | date:'MMM dd' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Updated</span>
                <span>{{ task()!.updatedAt | date:'MMM dd' }}</span>
              </div>
            </div>

            @if (task()!.tags?.length) {
              <div class="tags">
                @for (tag of task()!.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <ng-template #notFound>
      <div class="empty-state" style="height: 60vh; justify-content: center">
        <span class="material-icons-round">search_off</span>
        <p>Task not found.</p>
        <a routerLink="/tasks" class="btn btn--secondary btn--sm">Back to Tasks</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .task-detail { max-width: 1200px; }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);

      a { color: var(--color-primary-light); text-decoration: none; &:hover { text-decoration: underline; } }
      .material-icons-round { font-size: 0.9rem; }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.25rem;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .detail-main { display: flex; flex-direction: column; gap: 1.25rem; }

    .detail-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .detail-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    .detail-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
    .detail-desc { font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.5rem; }

    .progress-section { margin-bottom: 1rem; }
    .progress-header { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem; }

    .progress-bar--lg { height: 10px; margin-bottom: 0.75rem; }
    .progress-slider { width: 100%; accent-color: var(--color-primary); }

    .status-select {
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      padding: 0.45rem 0.75rem;
      outline: none;
      cursor: pointer;
      &:focus { border-color: var(--color-primary); }
      option { background: var(--surface-card); }
    }

    .blocker-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--border-radius-sm);
      padding: 1rem;

      .material-icons-round { color: var(--color-danger); margin-top: 2px; }
      strong { display: block; color: var(--color-danger); font-size: 0.875rem; }
      p { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; }
    }

    .comments-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }

    /* Info Card */
    .info-card h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; }
    .info-list { display: flex; flex-direction: column; gap: 0.65rem; }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding-bottom: 0.65rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      &:last-child { border-bottom: none; }
    }
    .info-label { color: var(--text-muted); }

    .tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem; }
    .tag {
      padding: 0.2rem 0.6rem;
      background: rgba(99,102,241,0.1);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: var(--border-radius-full);
      font-size: 0.72rem;
      color: var(--color-primary-light);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      gap: 0.5rem;
      color: var(--text-muted);
      text-align: center;
      .material-icons-round { font-size: 2.5rem; opacity: 0.4; }
      p { font-size: 0.875rem; }
    }
  `],
})
export class TaskDetailComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  allTasks = this.store.selectSignal(selectAllTasks);
  isManager = this.store.selectSignal(selectIsManager);
  taskId = signal<string>('');

  statusOptions = TASK_STATUS_ORDER;

  task = () => this.allTasks().find((t) => t.id === this.taskId()) ?? null;

  ngOnInit(): void {
    this.taskId.set(this.route.snapshot.paramMap.get('id') ?? '');
  }

  getStatusLabel(s: TaskStatus): string { return TASK_STATUS_LABELS[s] ?? s; }

  isOverdue(): boolean {
    const t = this.task();
    if (!t) return false;
    return new Date(t.dueDate) < new Date() && !['completed', 'cancelled'].includes(t.status);
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as TaskStatus;
    this.store.dispatch(updateTaskStatus({ id: this.taskId(), status }));
  }

  onProgressChange(event: Event): void {
    const pct = Number((event.target as HTMLInputElement).value);
    this.store.dispatch(updateTaskProgress({ id: this.taskId(), progressPercent: pct }));
  }
}
