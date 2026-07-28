import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { selectAllTasks } from '../../../store/tasks/tasks.selectors';
import { loadTasks, updateTaskStatus } from '../../../store/tasks/tasks.actions';
import { Task, TaskStatus, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from '../../../core/models/task.model';

@Component({
  selector: 'app-employee-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="workspace animate-fade-in">
      <div class="workspace__header">
        <div>
          <h1 class="page-title">My Workspace</h1>
          <p class="text-secondary">{{ today }}</p>
        </div>
        <div class="header-badges">
          <span class="badge badge--in-progress">{{ myInProgress().length }} In Progress</span>
          @if (myBlocked().length > 0) {
            <span class="badge badge--blocked">{{ myBlocked().length }} Blocked</span>
          }
        </div>
      </div>

      <div class="workspace__grid">
        <!-- My Tasks Panel -->
        <div class="tasks-panel">
          <div class="card">
            <div class="section-header">
              <h3><span class="material-icons-round">task_alt</span> My Tasks</h3>
              <a routerLink="/tasks" class="view-all">All tasks <span class="material-icons-round">arrow_forward</span></a>
            </div>

            @if (myTasks().length === 0) {
              <div class="empty-state">
                <span class="material-icons-round">check_circle</span>
                <p>You have no tasks assigned.</p>
                <p class="text-muted">Your manager will assign tasks to you.</p>
              </div>
            }

            <div class="task-list stagger">
              @for (task of myTasks(); track task.id) {
                <div class="task-item animate-fade-in" [class.task-item--blocked]="task.isBlocked">
                  <div class="task-item__header">
                    <span class="badge badge--{{ task.priority }}">{{ task.priority }}</span>
                    @if (task.isBlocked) {
                      <span class="badge badge--blocked">Blocked</span>
                    }
                    <span class="task-due" [class.overdue]="isOverdue(task)">
                      <span class="material-icons-round">schedule</span>
                      Due {{ task.dueDate | date: 'MMM dd' }}
                    </span>
                  </div>
                  <h4 class="task-title">{{ task.title }}</h4>
                  @if (task.description) {
                    <p class="task-desc text-muted">{{ task.description | slice:0:100 }}{{ task.description.length > 100 ? '...' : '' }}</p>
                  }

                  <!-- Progress -->
                  <div class="task-progress">
                    <div class="progress-bar">
                      <div class="progress-bar__fill" [style.width.%]="task.progressPercent"></div>
                    </div>
                    <span class="progress-pct text-muted">{{ task.progressPercent }}%</span>
                  </div>

                  <!-- Status selector -->
                  <div class="task-actions">
                    <select
                      class="status-select"
                      [value]="task.status"
                      (change)="onStatusChange(task.id, $event)"
                    >
                      @for (s of statusOptions; track s) {
                        <option [value]="s">{{ getStatusLabel(s) }}</option>
                      }
                    </select>
                    <a [routerLink]="['/tasks', task.id]" class="btn btn--icon btn--sm" data-tooltip="View Details">
                      <span class="material-icons-round">open_in_new</span>
                    </a>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel: Standup + Stats -->
        <div class="right-panel">

          <!-- Daily Standup Form -->
          <div class="card standup-card">
            <div class="section-header">
              <h3><span class="material-icons-round">event_note</span> Daily Standup</h3>
              @if (standupSubmitted()) {
                <span class="badge badge--completed">Submitted ✓</span>
              }
            </div>

            @if (standupSubmitted()) {
              <div class="standup-done">
                <span class="material-icons-round">check_circle</span>
                <p>Standup submitted for today!</p>
                <p class="text-muted">Your manager has been notified.</p>
              </div>
            } @else {
              <form [formGroup]="standupForm" (ngSubmit)="onSubmitStandup()" class="standup-form">
                <div class="standup-field">
                  <label>
                    <span class="material-icons-round">check</span>
                    What did I complete?
                  </label>
                  <textarea formControlName="completed" placeholder="Describe what you finished today..." rows="3"></textarea>
                </div>

                <div class="standup-field">
                  <label>
                    <span class="material-icons-round">arrow_forward</span>
                    What's next?
                  </label>
                  <textarea formControlName="planned" placeholder="What will you work on next?" rows="3"></textarea>
                </div>

                <div class="standup-field">
                  <label>
                    <span class="material-icons-round" style="color: var(--color-danger)">block</span>
                    Blockers
                  </label>
                  <textarea formControlName="blockers" placeholder="Any blockers? (leave blank if none)" rows="2"></textarea>
                </div>

                <div class="standup-field">
                  <label>
                    <span class="material-icons-round" style="color: var(--color-warning)">support</span>
                    Need help with?
                  </label>
                  <textarea formControlName="helpNeeded" placeholder="Is there anything you need help with?" rows="2"></textarea>
                </div>

                <div class="standup-progress-field">
                  <label>Overall progress today: <strong>{{ progressValue() }}%</strong></label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    formControlName="progressPercent"
                    class="progress-slider"
                  />
                  <div class="slider-labels">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn--primary w-full"
                  [disabled]="standupForm.get('completed')?.invalid"
                >
                  <span class="material-icons-round">send</span>
                  Submit Standup
                </button>
              </form>
            }
          </div>

          <!-- Quick Stats -->
          <div class="card stats-card">
            <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 1rem;">My Stats</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ myTasks().length }}</span>
                <span class="stat-label">Total Assigned</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" style="color: var(--color-success)">{{ myCompleted().length }}</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" style="color: var(--color-info)">{{ myInProgress().length }}</span>
                <span class="stat-label">In Progress</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" style="color: var(--color-danger)">{{ myBlocked().length }}</span>
                <span class="stat-label">Blocked</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace { max-width: 1400px; }

    .workspace__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }
    .header-badges { display: flex; gap: 0.5rem; align-items: center; }

    .workspace__grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.25rem;

      @media (max-width: 1100px) { grid-template-columns: 1fr; }
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 600;

        .material-icons-round { font-size: 1.1rem; color: var(--color-primary); }
      }
    }

    .view-all {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: var(--color-primary-light);
      text-decoration: none;
      font-weight: 500;
      .material-icons-round { font-size: 0.9rem; }
    }

    /* Task List */
    .task-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .task-item {
      padding: 1rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--surface-border);
      background: var(--surface-elevated);
      transition: var(--transition-fast);

      &:hover { border-color: rgba(99,102,241,0.3); }
      &--blocked { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }
    }

    .task-item__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .task-due {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--text-muted);

      .material-icons-round { font-size: 0.85rem; }
      &.overdue { color: var(--color-danger); font-weight: 600; }
    }

    .task-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.35rem; }
    .task-desc { font-size: 0.8rem; margin-bottom: 0.75rem; }

    .task-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      .progress-bar { flex: 1; }
    }

    .progress-pct { font-size: 0.75rem; width: 32px; text-align: right; }

    .task-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-select {
      flex: 1;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      cursor: pointer;
      outline: none;

      &:focus { border-color: var(--color-primary); }
      option { background: var(--surface-card); }
    }

    /* Standup Form */
    .right-panel { display: flex; flex-direction: column; gap: 1.25rem; }

    .standup-card { }

    .standup-form { display: flex; flex-direction: column; gap: 1rem; }

    .standup-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;

        .material-icons-round { font-size: 0.9rem; }
      }

      textarea {
        background: var(--surface-elevated);
        border: 1px solid var(--surface-border);
        border-radius: var(--border-radius-sm);
        color: var(--text-primary);
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        padding: 0.65rem 0.75rem;
        resize: vertical;
        outline: none;
        transition: var(--transition-fast);

        &::placeholder { color: var(--text-muted); }
        &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
      }
    }

    .standup-progress-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label { font-size: 0.8rem; color: var(--text-secondary); }
    }

    .progress-slider {
      width: 100%;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .standup-done {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      gap: 0.5rem;
      text-align: center;

      .material-icons-round { font-size: 2.5rem; color: var(--color-success); }
      p { font-size: 0.9rem; }
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      background: var(--surface-elevated);
      border-radius: var(--border-radius-sm);
      gap: 0.25rem;
    }

    .stat-value { font-size: 1.5rem; font-weight: 800; }
    .stat-label { font-size: 0.72rem; color: var(--text-muted); text-align: center; }

    /* Empty state */
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
export class EmployeeWorkspaceComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  currentUser = this.store.selectSignal(selectCurrentUser);
  allTasks = this.store.selectSignal(selectAllTasks);
  standupSubmitted = signal(false);

  statusOptions = TASK_STATUS_ORDER;

  standupForm = this.fb.group({
    completed: ['', Validators.required],
    planned: [''],
    blockers: [''],
    helpNeeded: [''],
    progressPercent: [50],
  });

  progressValue = computed(() => this.standupForm.get('progressPercent')?.value ?? 50);

  myTasks = computed(() => {
    const uid = this.currentUser()?.id;
    if (!uid) return [];
    return this.allTasks().filter((t) => t.assigneeIds?.includes(uid));
  });

  myInProgress = computed(() => this.myTasks().filter((t) => t.status === 'in_progress'));
  myCompleted = computed(() => this.myTasks().filter((t) => t.status === 'completed'));
  myBlocked = computed(() => this.myTasks().filter((t) => t.isBlocked));

  get today(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  ngOnInit(): void {
    const uid = this.currentUser()?.id;
    if (uid) this.store.dispatch(loadTasks({}));
  }

  getStatusLabel(s: TaskStatus): string { return TASK_STATUS_LABELS[s] ?? s; }

  isOverdue(t: Task): boolean {
    return new Date(t.dueDate) < new Date() && !['completed', 'cancelled'].includes(t.status);
  }

  onStatusChange(taskId: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as TaskStatus;
    this.store.dispatch(updateTaskStatus({ id: taskId, status }));
  }

  onSubmitStandup(): void {
    if (this.standupForm.get('completed')?.invalid) return;
    // In a full implementation, dispatch a standup create action here
    this.standupSubmitted.set(true);
  }
}
