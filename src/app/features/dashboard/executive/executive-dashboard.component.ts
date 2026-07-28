import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { selectAllTasks, selectDashboardMetrics } from '../../../store/tasks/tasks.selectors';
import { loadTasks, createTask } from '../../../store/tasks/tasks.actions';
import { Task, TaskStatus, TaskPriority, TASK_STATUS_LABELS } from '../../../core/models/task.model';
import { TeamService } from '../../../core/services/team.service';
import { UserProfile } from '../../../core/models/user.model';

interface KpiCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="dashboard animate-fade-in">

      <!-- Header -->
      <div class="dashboard__header">
        <div>
          <h1 class="page-title">Project Manager Portal</h1>
          <p class="text-secondary">Track team capacity, assign tasks, clear blockers, and monitor daily progress</p>
        </div>
        <div class="header-actions">
          <button class="btn btn--secondary btn--sm" routerLink="/reports">
            <span class="material-icons-round">analytics</span>
            View Reports
          </button>
          <button class="btn btn--primary btn--sm" (click)="showCreateModal.set(true)">
            <span class="material-icons-round">add</span>
            Assign New Task
          </button>
        </div>
      </div>

      <!-- PM Workflow Quick Actions Bar -->
      <div class="pm-actions-bar stagger">
        <div class="pm-action-card card" routerLink="/team-capacity">
          <div class="pm-action-icon icon-indigo">
            <span class="material-icons-round">person_add</span>
          </div>
          <div class="pm-action-info">
            <h4>1. Add / Manage Team</h4>
            <p>{{ members().length }} Members • Check Capacity</p>
          </div>
          <span class="material-icons-round arrow">arrow_forward</span>
        </div>

        <div class="pm-action-card card" (click)="showCreateModal.set(true)">
          <div class="pm-action-icon icon-emerald">
            <span class="material-icons-round">add_task</span>
          </div>
          <div class="pm-action-info">
            <h4>2. Assign New Task</h4>
            <p>Create task & assign team member</p>
          </div>
          <span class="material-icons-round arrow">add</span>
        </div>

        <div class="pm-action-card card" routerLink="/daily-followup">
          <div class="pm-action-icon icon-amber">
            <span class="material-icons-round">event_note</span>
          </div>
          <div class="pm-action-info">
            <h4>3. Daily Follow-up</h4>
            <p>Review standups & clear blockers</p>
          </div>
          <span class="material-icons-round arrow">arrow_forward</span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid stagger">
        @for (kpi of kpiCards(); track kpi.label) {
          <div class="kpi-card card animate-fade-in">
            <div class="kpi-card__icon" [style.background]="kpi.color + '22'">
              <span class="material-icons-round" [style.color]="kpi.color">{{ kpi.icon }}</span>
            </div>
            <div class="kpi-card__info">
              <span class="kpi-value">{{ kpi.value }}</span>
              <span class="kpi-label">{{ kpi.label }}</span>
            </div>
            @if (kpi.trend) {
              <div class="kpi-trend" [class.up]="kpi.trendUp" [class.down]="!kpi.trendUp">
                <span class="material-icons-round">{{ kpi.trendUp ? 'trending_up' : 'trending_down' }}</span>
                {{ kpi.trend }}
              </div>
            }
          </div>
        }
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard__grid">

        <!-- Task Status Breakdown -->
        <div class="card section-card">
          <div class="section-header">
            <h3>Tasks by Status</h3>
            <a routerLink="/tasks" class="view-all">Kanban Board <span class="material-icons-round">arrow_forward</span></a>
          </div>
          <div class="status-breakdown">
            @for (status of statusBreakdown(); track status.key) {
              <div class="status-row">
                <div class="status-label">
                  <span class="status-dot" [style.background]="status.color"></span>
                  {{ status.label }}
                </div>
                <div class="status-bar-wrap">
                  <div class="status-bar">
                    <div
                      class="status-bar__fill"
                      [style.width.%]="status.percent"
                      [style.background]="status.color"
                    ></div>
                  </div>
                  <span class="status-count">{{ status.count }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Blocked Tasks Alert -->
        <div class="card section-card">
          <div class="section-header">
            <h3>
              <span class="material-icons-round" style="color: var(--color-danger); font-size: 1rem;">block</span>
              Blocked Tasks
            </h3>
            <span class="badge badge--blocked">{{ blockedTasks().length }}</span>
          </div>
          @if (blockedTasks().length === 0) {
            <div class="empty-state">
              <span class="material-icons-round" style="color: var(--color-success)">check_circle</span>
              <p>No blocked tasks right now!</p>
            </div>
          } @else {
            <div class="blocked-list">
              @for (task of blockedTasks(); track task.id) {
                <div class="blocked-item">
                  <div class="blocked-item__info">
                    <span class="badge badge--{{ task.priority }} badge--sm">{{ task.priority }}</span>
                    <span class="blocked-title">{{ task.title }}</span>
                  </div>
                  <span class="blocked-reason text-muted">{{ task.blockerReason || 'No reason given' }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Recent Tasks -->
        <div class="card section-card section-card--wide">
          <div class="section-header">
            <h3>Recent Tasks & Assignments</h3>
            <a routerLink="/tasks" class="view-all">All Tasks <span class="material-icons-round">arrow_forward</span></a>
          </div>
          <div class="task-table">
            <div class="task-table__header">
              <span>Task</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Due Date</span>
            </div>
            @for (task of recentTasks(); track task.id) {
              <div class="task-table__row" [routerLink]="['/tasks', task.id]">
                <span class="task-name">{{ task.title }}</span>
                <span class="badge badge--{{ task.priority }}">{{ task.priority }}</span>
                <span class="badge badge--{{ task.status.replace('_','-') }}">{{ getStatusLabel(task.status) }}</span>
                <div class="task-progress">
                  <div class="progress-bar">
                    <div class="progress-bar__fill" [style.width.%]="task.progressPercent"></div>
                  </div>
                  <span class="progress-pct">{{ task.progressPercent }}%</span>
                </div>
                <span class="task-due" [class.overdue]="isOverdue(task)">
                  {{ task.dueDate | date: 'MMM dd' }}
                </span>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- Create & Assign Task Modal -->
      @if (showCreateModal()) {
        <div class="modal-overlay" (click)="showCreateModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><span class="material-icons-round">add_task</span> Create & Assign Task</h3>
              <button class="btn btn--icon" (click)="showCreateModal.set(false)">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="createTaskForm" (ngSubmit)="onCreateTaskSubmit()" class="modal-form">
              <div class="form-group">
                <label>Task Title *</label>
                <input type="text" class="input" formControlName="title" placeholder="e.g. Implement Auth Guards & API" />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea class="input" formControlName="description" rows="3" placeholder="What needs to be completed?"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Assign To Team Member *</label>
                  <select class="input" formControlName="assigneeId">
                    <option value="">Select Team Member...</option>
                    @for (m of members(); track m.id) {
                      <option [value]="m.id">{{ m.displayName }} ({{ m.departmentId }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Priority *</label>
                  <select class="input" formControlName="priority">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Due Date *</label>
                  <input type="date" class="input" formControlName="dueDate" />
                </div>

                <div class="form-group">
                  <label>Estimated Hours</label>
                  <input type="number" class="input" formControlName="estimatedHours" min="1" placeholder="8" />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn--secondary" (click)="showCreateModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn--primary" [disabled]="createTaskForm.invalid">
                  <span class="material-icons-round">add</span> Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; }

    .dashboard__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }
    .header-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }

    /* PM Action Cards Bar */
    .pm-actions-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .pm-action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.1rem 1.25rem;
      cursor: pointer;
      transition: var(--transition-fast);

      &:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .arrow { color: var(--text-muted); margin-left: auto; font-size: 1.2rem; }
    }

    .pm-action-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-icons-round { font-size: 1.3rem; color: #fff; }
    }

    .icon-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .icon-emerald { background: linear-gradient(135deg, #10b981, #059669); }
    .icon-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .pm-action-info {
      display: flex;
      flex-direction: column;
      h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.15rem; }
      p { font-size: 0.78rem; color: var(--text-muted); }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      position: relative;
      overflow: hidden;
      cursor: default;
    }

    .kpi-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-icons-round { font-size: 1.4rem; }
    }

    .kpi-card__info { display: flex; flex-direction: column; flex: 1; }
    .kpi-value { font-size: 1.75rem; font-weight: 800; line-height: 1; margin-bottom: 0.25rem; }
    .kpi-label { font-size: 0.78rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.72rem;
      font-weight: 600;
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
      .material-icons-round { font-size: 0.85rem; }
      &.up { color: var(--color-success); }
      &.down { color: var(--color-danger); }
    }

    /* Dashboard Grid */
    .dashboard__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      @media (max-width: 1024px) { grid-template-columns: 1fr; }
    }

    .section-card { display: flex; flex-direction: column; gap: 1rem; }
    .section-card--wide { grid-column: 1 / -1; }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; }
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
      &:hover { text-decoration: underline; }
    }

    .status-breakdown { display: flex; flex-direction: column; gap: 0.75rem; }
    .status-row { display: flex; align-items: center; gap: 1rem; }
    .status-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); width: 140px; flex-shrink: 0; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-bar-wrap { flex: 1; display: flex; align-items: center; gap: 0.75rem; }
    .status-bar { flex: 1; height: 6px; background: var(--surface-hover); border-radius: var(--border-radius-full); overflow: hidden; }
    .status-bar__fill { height: 100%; border-radius: var(--border-radius-full); transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1); }
    .status-count { font-size: 0.8rem; font-weight: 600; width: 24px; text-align: right; }

    .blocked-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .blocked-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); border-radius: var(--border-radius-sm); }
    .blocked-item__info { display: flex; align-items: center; gap: 0.5rem; }
    .blocked-title { font-size: 0.875rem; font-weight: 500; }
    .blocked-reason { font-size: 0.8rem; }

    .task-table { display: flex; flex-direction: column; }
    .task-table__header { display: grid; grid-template-columns: 2fr 0.8fr 1.2fr 1.2fr 0.8fr; gap: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--surface-border); }
    .task-table__row { display: grid; grid-template-columns: 2fr 0.8fr 1.2fr 1.2fr 0.8fr; gap: 0.75rem; padding: 0.65rem 0.75rem; align-items: center; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 0.875rem; &:hover { background: var(--surface-elevated); } }
    .task-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .task-progress { display: flex; align-items: center; gap: 0.5rem; .progress-bar { flex: 1; } }
    .progress-pct { font-size: 0.75rem; color: var(--text-muted); width: 30px; }
    .task-due { font-size: 0.8rem; color: var(--text-secondary); &.overdue { color: var(--color-danger); font-weight: 600; } }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; gap: 0.5rem; color: var(--text-muted); text-align: center; .material-icons-round { font-size: 2.5rem; opacity: 0.4; } p { font-size: 0.875rem; } }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal-card { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius-lg); width: 100%; max-width: 540px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--surface-border); h3 { font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; } }
    .modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; } select.input { cursor: pointer; option { background: var(--surface-card); } } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--surface-border); padding-top: 0.75rem; }
  `],
})
export class ExecutiveDashboardComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);

  currentUser = this.store.selectSignal(selectCurrentUser);
  allTasks = this.store.selectSignal(selectAllTasks);
  metrics = this.store.selectSignal(selectDashboardMetrics);
  members = signal<UserProfile[]>([]);

  showCreateModal = signal(false);

  createTaskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    assigneeId: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    dueDate: [new Date().toISOString().split('T')[0], Validators.required],
    estimatedHours: [8],
  });

  kpiCards = computed((): KpiCard[] => {
    const m = this.metrics();
    return [
      { label: 'In Progress', value: m.inProgress, icon: 'pending_actions', color: '#3b82f6', trend: '+2 today', trendUp: true },
      { label: 'Blocked', value: m.blocked, icon: 'block', color: '#ef4444', trend: m.blocked > 0 ? 'Needs attention' : 'All clear', trendUp: m.blocked === 0 },
      { label: 'Overdue', value: m.overdue, icon: 'schedule', color: '#f59e0b', trend: m.overdue > 0 ? 'Action needed' : 'On track', trendUp: m.overdue === 0 },
      { label: 'Done Today', value: m.completedToday, icon: 'task_alt', color: '#10b981', trend: '+' + m.completedToday + ' today', trendUp: true },
      { label: 'For Review', value: m.readyForReview, icon: 'rate_review', color: '#ec4899' },
      { label: 'Total Tasks', value: m.total, icon: 'list_alt', color: '#6366f1' },
    ];
  });

  statusBreakdown = computed(() => {
    const tasks = this.allTasks();
    const total = tasks.length || 1;
    const statusColors: Record<string, string> = {
      new: '#6366f1', assigned: '#8b5cf6', in_progress: '#3b82f6',
      on_hold: '#f59e0b', blocked: '#ef4444', ready_for_review: '#ec4899',
      completed: '#10b981', cancelled: '#64748b',
    };
    const counts: Record<string, number> = {};
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1; });
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([key, count]) => ({
        key,
        label: TASK_STATUS_LABELS[key as TaskStatus] ?? key,
        count,
        percent: Math.round((count / total) * 100),
        color: statusColors[key] ?? '#6366f1',
      }));
  });

  blockedTasks = computed(() => this.allTasks().filter((t) => t.isBlocked).slice(0, 5));
  recentTasks = computed(() => [...this.allTasks()].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 8));

  ngOnInit(): void {
    this.store.dispatch(loadTasks({}));
    this.teamService.members$.subscribe((m) => this.members.set(m));
  }

  getStatusLabel(s: TaskStatus): string { return TASK_STATUS_LABELS[s] ?? s; }

  isOverdue(t: Task): boolean {
    return new Date(t.dueDate) < new Date() && !['completed', 'cancelled'].includes(t.status);
  }

  onCreateTaskSubmit(): void {
    if (this.createTaskForm.invalid) return;
    const v = this.createTaskForm.value;

    this.store.dispatch(createTask({
      task: {
        title: v.title!,
        description: v.description ?? '',
        priority: (v.priority as TaskPriority) ?? 'medium',
        dueDate: new Date(v.dueDate!),
        category: 'Development',
        estimatedHours: v.estimatedHours ?? 8,
        createdBy: this.currentUser()?.id ?? 'usr-pm-1',
        teamId: 'team-main',
        assigneeIds: v.assigneeId ? [v.assigneeId] : [],
        tags: [],
      },
    }));

    this.createTaskForm.reset({ priority: 'medium', estimatedHours: 8, dueDate: new Date().toISOString().split('T')[0] });
    this.showCreateModal.set(false);
  }
}
