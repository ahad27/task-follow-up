import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  selectFilteredTasks,
  selectTasksLoading,
} from '../../../store/tasks/tasks.selectors';
import {
  loadTasks, createTask, updateTaskStatus, setFilter, clearFilter,
} from '../../../store/tasks/tasks.actions';
import {
  Task, TaskStatus, TaskPriority,
  TASK_STATUS_LABELS, TASK_STATUS_ORDER,
} from '../../../core/models/task.model';
import { selectCurrentUser, selectIsManager } from '../../../store/auth/auth.selectors';
import { TeamService } from '../../../core/services/team.service';
import { UserProfile } from '../../../core/models/user.model';

type ViewMode = 'kanban' | 'list';

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string; icon: string }[] = [
  { status: 'new',              label: 'New',             color: '#6366f1', icon: 'fiber_new' },
  { status: 'assigned',         label: 'Assigned',        color: '#8b5cf6', icon: 'person_pin' },
  { status: 'in_progress',      label: 'In Progress',     color: '#3b82f6', icon: 'pending_actions' },
  { status: 'on_hold',          label: 'On Hold',         color: '#f59e0b', icon: 'pause_circle' },
  { status: 'blocked',          label: 'Blocked',         color: '#ef4444', icon: 'block' },
  { status: 'ready_for_review', label: 'Review',          color: '#ec4899', icon: 'rate_review' },
  { status: 'completed',        label: 'Completed',       color: '#10b981', icon: 'task_alt' },
];

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="task-board animate-fade-in">

      <!-- Header -->
      <div class="board-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="text-secondary">{{ filteredTasks().length }} tasks total</p>
        </div>
        <div class="board-actions">
          <!-- View toggle -->
          <div class="view-toggle">
            <button [class.active]="viewMode() === 'kanban'" (click)="viewMode.set('kanban')" data-tooltip="Kanban">
              <span class="material-icons-round">view_kanban</span>
            </button>
            <button [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" data-tooltip="List">
              <span class="material-icons-round">list</span>
            </button>
          </div>

          @if (isManager()) {
            <button class="btn btn--primary btn--sm" (click)="showCreateForm.set(true)">
              <span class="material-icons-round">add</span> New Task
            </button>
          }
        </div>
      </div>

      <!-- Filters -->
      <div class="board-filters">
        <div class="search-mini">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="Search tasks..." (input)="onSearch($event)" />
        </div>
        <div class="filter-chips">
          @for (p of priorities; track p.value) {
            <button
              class="chip"
              [class.chip--active]="activePriority() === p.value"
              (click)="togglePriority(p.value)"
            >{{ p.label }}</button>
          }
          <button class="chip chip--danger" *ngIf="activePriority() || searchQuery()" (click)="onClearFilters()">
            <span class="material-icons-round">close</span> Clear
          </button>
        </div>
      </div>

      <!-- KANBAN VIEW -->
      @if (viewMode() === 'kanban') {
        <div class="kanban-board">
          @for (col of kanbanColumns; track col.status) {
            <div class="kanban-col">
              <div class="kanban-col__header" [style.border-top-color]="col.color">
                <div class="col-title">
                  <span class="material-icons-round" [style.color]="col.color">{{ col.icon }}</span>
                  {{ col.label }}
                </div>
                <span class="col-count" [style.background]="col.color + '22'" [style.color]="col.color">
                  {{ getTasksByStatus(col.status).length }}
                </span>
              </div>
              <div class="kanban-cards">
                @for (task of getTasksByStatus(col.status); track task.id) {
                  <div class="task-card" [class.task-card--blocked]="task.isBlocked" [routerLink]="['/tasks', task.id]">
                    @if (task.isBlocked) {
                      <div class="blocked-banner">
                        <span class="material-icons-round">block</span> Blocked
                      </div>
                    }
                    <div class="task-card__header">
                      <span class="badge badge--{{ task.priority }}">{{ task.priority }}</span>
                      <span class="task-due-mini" [class.overdue]="isOverdue(task)">{{ task.dueDate | date:'MMM d' }}</span>
                    </div>
                    <p class="task-card__title">{{ task.title }}</p>
                    @if (task.description) {
                      <p class="task-card__desc">{{ task.description | slice:0:80 }}{{ task.description.length > 80 ? '...' : '' }}</p>
                    }
                    <div class="task-card__footer">
                      <div class="progress-bar">
                        <div class="progress-bar__fill" [style.width.%]="task.progressPercent"></div>
                      </div>
                      <span class="task-pct">{{ task.progressPercent }}%</span>
                    </div>
                  </div>
                }
                @if (getTasksByStatus(col.status).length === 0) {
                  <div class="col-empty">No tasks here</div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- LIST VIEW -->
      @if (viewMode() === 'list') {
        <div class="card list-view">
          <div class="list-header">
            <span>Title</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Due Date</span>
            <span>Actions</span>
          </div>
          @for (task of filteredTasks(); track task.id) {
            <div class="list-row">
              <span class="list-title">{{ task.title }}</span>
              <span class="badge badge--{{ task.priority }}">{{ task.priority }}</span>
              <span class="badge badge--{{ task.status.replace('_','-') }}">{{ getStatusLabel(task.status) }}</span>
              <div class="list-progress">
                <div class="progress-bar"><div class="progress-bar__fill" [style.width.%]="task.progressPercent"></div></div>
                <span>{{ task.progressPercent }}%</span>
              </div>
              <span [class.text-danger]="isOverdue(task)">{{ task.dueDate | date:'MMM dd' }}</span>
              <div class="list-actions">
                <a [routerLink]="['/tasks', task.id]" class="btn btn--icon btn--sm" data-tooltip="View">
                  <span class="material-icons-round">open_in_new</span>
                </a>
                @if (isManager()) {
                  <button class="btn btn--icon btn--sm" data-tooltip="Delete" (click)="$event.stopPropagation()">
                    <span class="material-icons-round" style="color: var(--color-danger)">delete</span>
                  </button>
                }
              </div>
            </div>
          }
          @if (filteredTasks().length === 0) {
            <div class="empty-state" style="padding: 3rem">
              <span class="material-icons-round">task_alt</span>
              <p>No tasks found. Adjust filters or create a new task.</p>
            </div>
          }
        </div>
      }

      <!-- Create Task Modal -->
      @if (showCreateForm()) {
        <div class="modal-overlay" (click)="showCreateForm.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Task</h3>
              <button class="btn btn--icon" (click)="showCreateForm.set(false)">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="createForm" (ngSubmit)="onCreateTask()" class="create-form">
              <div class="form-group">
                <label>Title *</label>
                <input type="text" class="input" formControlName="title" placeholder="Task title" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea class="input" formControlName="description" rows="3" placeholder="What needs to be done?"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Priority</label>
                  <select class="input" formControlName="priority">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Due Date *</label>
                  <input type="date" class="input" formControlName="dueDate" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Assign To Team Member</label>
                  <select class="input" formControlName="assigneeId">
                    <option value="">Unassigned</option>
                    @for (m of members(); track m.id) {
                      <option [value]="m.id">{{ m.displayName }} ({{ m.departmentId }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Category</label>
                  <input type="text" class="input" formControlName="category" placeholder="e.g. Development" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Estimated Hours</label>
                  <input type="number" class="input" formControlName="estimatedHours" min="0" placeholder="0" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn--secondary" (click)="showCreateForm.set(false)">Cancel</button>
                <button type="submit" class="btn btn--primary" [disabled]="createForm.invalid">
                  <span class="material-icons-round">add</span> Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .task-board { max-width: 100%; }

    .board-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }
    .board-actions { display: flex; align-items: center; gap: 0.75rem; }

    /* View Toggle */
    .view-toggle {
      display: flex;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      overflow: hidden;

      button {
        padding: 0.45rem 0.75rem;
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: var(--transition-fast);

        .material-icons-round { font-size: 1.1rem; }

        &.active { background: rgba(99,102,241,0.15); color: var(--color-primary); }
        &:hover:not(.active) { background: var(--surface-elevated); }
      }
    }

    /* Filters */
    .board-filters {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .search-mini {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      padding: 0.4rem 0.75rem;
      min-width: 220px;

      .material-icons-round { font-size: 1rem; color: var(--text-muted); }
      input { background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 0.875rem; font-family: 'Inter', sans-serif; &::placeholder { color: var(--text-muted); } }
    }

    .filter-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .chip {
      padding: 0.3rem 0.75rem;
      border-radius: var(--border-radius-full);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: var(--transition-fast);
      display: flex;
      align-items: center;
      gap: 0.3rem;

      &:hover { border-color: var(--color-primary); color: var(--color-primary-light); }
      &--active { background: rgba(99,102,241,0.15); border-color: var(--color-primary); color: var(--color-primary-light); font-weight: 600; }
      &--danger { color: var(--color-danger); border-color: rgba(239,68,68,0.3); .material-icons-round { font-size: 0.85rem; } }
    }

    /* Kanban */
    .kanban-board {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 1rem;
      min-height: calc(100vh - 280px);

      &::-webkit-scrollbar { height: 6px; }
    }

    .kanban-col {
      min-width: 280px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .kanban-col__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--surface-card);
      border-radius: var(--border-radius-sm);
      border-top: 3px solid;
    }

    .col-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;

      .material-icons-round { font-size: 1rem; }
    }

    .col-count {
      padding: 0.1rem 0.5rem;
      border-radius: var(--border-radius-full);
      font-size: 0.72rem;
      font-weight: 700;
    }

    .kanban-cards { display: flex; flex-direction: column; gap: 0.6rem; flex: 1; }

    .task-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      padding: 0.875rem;
      cursor: pointer;
      transition: var(--transition-fast);

      &:hover {
        border-color: rgba(99,102,241,0.4);
        box-shadow: var(--shadow-sm);
        transform: translateY(-1px);
      }

      &--blocked { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.04); }
    }

    .blocked-banner {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-danger);
      margin-bottom: 0.5rem;
      .material-icons-round { font-size: 0.85rem; }
    }

    .task-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .task-due-mini {
      font-size: 0.72rem;
      color: var(--text-muted);
      &.overdue { color: var(--color-danger); font-weight: 600; }
    }

    .task-card__title {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      line-height: 1.4;
    }

    .task-card__desc {
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .task-card__footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      .progress-bar { flex: 1; }
    }

    .task-pct { font-size: 0.7rem; color: var(--text-muted); width: 28px; text-align: right; }

    .col-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      border: 1px dashed var(--surface-border);
      border-radius: var(--border-radius-sm);
    }

    /* List View */
    .list-view { overflow: hidden; }

    .list-header {
      display: grid;
      grid-template-columns: 2.5fr 0.8fr 1.2fr 1.2fr 0.8fr 0.7fr;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--surface-border);
    }

    .list-row {
      display: grid;
      grid-template-columns: 2.5fr 0.8fr 1.2fr 1.2fr 0.8fr 0.7fr;
      gap: 0.75rem;
      padding: 0.7rem 1rem;
      align-items: center;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: var(--transition-fast);

      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-elevated); }
    }

    .list-title { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .list-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      .progress-bar { flex: 1; }
    }

    .list-actions { display: flex; gap: 0.25rem; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 200ms ease both;
    }

    .modal-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-lg);
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: fadeIn 200ms ease both;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);

      h3 { font-size: 1.1rem; font-weight: 600; }
    }

    .create-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
      select.input { cursor: pointer; option { background: var(--surface-card); } }
      textarea.input { resize: vertical; font-family: 'Inter', sans-serif; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
      margin-top: 0.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      text-align: center;
      .material-icons-round { font-size: 2.5rem; opacity: 0.4; }
      p { font-size: 0.875rem; }
    }
  `],
})
export class TaskBoardComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);

  filteredTasks = this.store.selectSignal(selectFilteredTasks);
  loading = this.store.selectSignal(selectTasksLoading);
  isManager = this.store.selectSignal(selectIsManager);
  currentUser = this.store.selectSignal(selectCurrentUser);
  members = signal<UserProfile[]>([]);

  viewMode = signal<ViewMode>('kanban');
  showCreateForm = signal(false);
  activePriority = signal<TaskPriority | null>(null);
  searchQuery = signal('');

  kanbanColumns = KANBAN_COLUMNS;

  priorities = [
    { label: 'Critical', value: 'critical' as TaskPriority },
    { label: 'High', value: 'high' as TaskPriority },
    { label: 'Medium', value: 'medium' as TaskPriority },
    { label: 'Low', value: 'low' as TaskPriority },
  ];

  createForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['medium'],
    dueDate: ['', Validators.required],
    assigneeId: [''],
    category: [''],
    estimatedHours: [0],
  });

  ngOnInit(): void {
    this.store.dispatch(loadTasks({}));
    this.teamService.members$.subscribe((m) => this.members.set(m));
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.filteredTasks().filter((t) => t.status === status);
  }

  getStatusLabel(s: TaskStatus): string { return TASK_STATUS_LABELS[s] ?? s; }

  isOverdue(t: Task): boolean {
    return new Date(t.dueDate) < new Date() && !['completed', 'cancelled'].includes(t.status);
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    this.store.dispatch(setFilter({ filter: { searchQuery: q, priority: this.activePriority() ? [this.activePriority()!] : undefined } }));
  }

  togglePriority(p: TaskPriority): void {
    const next = this.activePriority() === p ? null : p;
    this.activePriority.set(next);
    this.store.dispatch(setFilter({ filter: { priority: next ? [next] : undefined, searchQuery: this.searchQuery() || undefined } }));
  }

  onClearFilters(): void {
    this.activePriority.set(null);
    this.searchQuery.set('');
    this.store.dispatch(clearFilter());
  }

  onCreateTask(): void {
    if (this.createForm.invalid) return;
    const v = this.createForm.value;
    this.store.dispatch(createTask({
      task: {
        title: v.title!,
        description: v.description ?? '',
        priority: (v.priority as TaskPriority) ?? 'medium',
        dueDate: new Date(v.dueDate!),
        category: v.category ?? '',
        estimatedHours: v.estimatedHours ?? 0,
        createdBy: this.currentUser()?.id ?? '',
        teamId: this.currentUser()?.teamId ?? '',
        assigneeIds: v.assigneeId ? [v.assigneeId] : [],
        tags: [],
      },
    }));
    this.createForm.reset({ priority: 'medium', estimatedHours: 0, assigneeId: '' });
    this.showCreateForm.set(false);
  }
}
