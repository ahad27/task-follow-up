import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectAllTasks, selectDashboardMetrics } from '../../store/tasks/tasks.selectors';
import { TeamService } from '../../core/services/team.service';
import { TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports & Analytics</h1>
          <p class="text-secondary">Comprehensive team performance, velocity, and blocker analytics</p>
        </div>
        <div class="header-actions">
          <button class="btn btn--secondary btn--sm" (click)="onExportData('csv')">
            <span class="material-icons-round">file_download</span> Export CSV
          </button>
          <button class="btn btn--primary btn--sm" (click)="onExportData('json')">
            <span class="material-icons-round">code</span> Export JSON
          </button>
        </div>
      </div>

      <!-- Time Filter Bar -->
      <div class="time-filter-bar">
        <button class="tab-btn" [class.active]="timeframe() === 'week'" (click)="timeframe.set('week')">
          This Week
        </button>
        <button class="tab-btn" [class.active]="timeframe() === 'month'" (click)="timeframe.set('month')">
          This Month
        </button>
        <button class="tab-btn" [class.active]="timeframe() === 'all'" (click)="timeframe.set('all')">
          All Time
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid stagger">
        <div class="card kpi-box">
          <span class="kpi-val text-primary">{{ metrics().total }}</span>
          <span class="kpi-lbl">Total Tasks Tracked</span>
        </div>
        <div class="card kpi-box">
          <span class="kpi-val text-emerald">{{ metrics().completedToday }}</span>
          <span class="kpi-lbl">Completed Today</span>
        </div>
        <div class="card kpi-box">
          <span class="kpi-val text-amber">{{ metrics().inProgress }}</span>
          <span class="kpi-lbl">Active In-Progress</span>
        </div>
        <div class="card kpi-box">
          <span class="kpi-val text-rose">{{ metrics().blocked }}</span>
          <span class="kpi-lbl">Active Blockers</span>
        </div>
      </div>

      <!-- Analytics Charts Grid -->
      <div class="analytics-grid">
        <!-- Task Status Velocity Distribution -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3><span class="material-icons-round">bar_chart</span> Task Status Breakdown</h3>
            <span class="text-muted text-xs">Real-time count</span>
          </div>

          <div class="bar-chart">
            @for (bar of statusDistribution(); track bar.status) {
              <div class="chart-row">
                <div class="row-label">
                  <span class="status-dot" [style.background]="bar.color"></span>
                  {{ bar.label }}
                </div>
                <div class="row-bar-wrap">
                  <div class="row-bar">
                    <div class="row-bar-fill" [style.width.%]="bar.percent" [style.background]="bar.color"></div>
                  </div>
                  <span class="row-count">{{ bar.count }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Priority Breakdown -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3><span class="material-icons-round">pie_chart</span> Priority Distribution</h3>
            <span class="text-muted text-xs">Task urgency</span>
          </div>

          <div class="priority-list">
            @for (p of priorityDistribution(); track p.priority) {
              <div class="priority-item">
                <div class="priority-info">
                  <span class="badge badge--{{ p.priority }}">{{ p.priority }}</span>
                  <span class="priority-count">{{ p.count }} tasks</span>
                </div>
                <div class="meter">
                  <div class="meter-fill" [style.width.%]="p.percent" [style.background]="p.color"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Team Member Performance Table -->
        <div class="card chart-card full-width">
          <div class="chart-header">
            <h3><span class="material-icons-round">people</span> Team Member Productivity Index</h3>
            <span class="text-muted text-xs">{{ members().length }} Members</span>
          </div>

          <div class="perf-table">
            <div class="table-head">
              <span>Member</span>
              <span>Role / Dept</span>
              <span>Total Tasks</span>
              <span>Active</span>
              <span>Blocked</span>
              <span>Capacity Health</span>
            </div>
            @for (m of members(); track m.id) {
              <div class="table-row">
                <div class="member-cell">
                  <div class="avatar avatar--sm avatar--initials">{{ m.displayName.charAt(0) }}</div>
                  <span class="font-weight-600">{{ m.displayName }}</span>
                </div>
                <span class="text-muted text-xs">{{ m.departmentId }}</span>
                <span class="font-weight-600">{{ getMemberStats(m.id).total }}</span>
                <span class="text-primary font-weight-600">{{ getMemberStats(m.id).active }}</span>
                <span class="text-rose font-weight-600">{{ getMemberStats(m.id).blocked }}</span>
                <div class="health-pill">
                  <div class="health-bar">
                    <div class="health-fill" [style.width.%]="getMemberUtilization(m)" [style.background]="getHealthColor(getMemberUtilization(m))"></div>
                  </div>
                  <span class="health-text" [style.color]="getHealthColor(getMemberUtilization(m))">{{ getMemberUtilization(m) }}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }
    .header-actions { display: flex; gap: 0.75rem; }

    .time-filter-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      padding: 0.4rem 1rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: var(--transition-fast);

      &.active {
        background: rgba(99,102,241,0.15);
        border-color: var(--color-primary);
        color: var(--color-primary-light);
        font-weight: 600;
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .kpi-box {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-val { font-size: 1.8rem; font-weight: 800; }
    .kpi-lbl { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }

    .text-emerald { color: #10b981; }
    .text-amber { color: #f59e0b; }
    .text-rose { color: #f43f5e; }

    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;

      @media (max-width: 1024px) { grid-template-columns: 1fr; }
    }

    .chart-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      &.full-width { grid-column: 1 / -1; }
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; .material-icons-round { color: var(--color-primary); } }
    }

    /* Bar chart */
    .bar-chart { display: flex; flex-direction: column; gap: 0.85rem; }
    .chart-row { display: flex; align-items: center; gap: 1rem; }
    .row-label { width: 140px; font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .row-bar-wrap { flex: 1; display: flex; align-items: center; gap: 0.75rem; }
    .row-bar { flex: 1; height: 8px; background: var(--surface-hover); border-radius: var(--border-radius-full); overflow: hidden; }
    .row-bar-fill { height: 100%; border-radius: var(--border-radius-full); transition: width 500ms ease; }
    .row-count { font-size: 0.8rem; font-weight: 700; width: 28px; text-align: right; }

    /* Priority chart */
    .priority-list { display: flex; flex-direction: column; gap: 1rem; }
    .priority-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .priority-info { display: flex; justify-content: space-between; align-items: center; }
    .priority-count { font-size: 0.8rem; color: var(--text-muted); }
    .meter { height: 8px; background: var(--surface-hover); border-radius: var(--border-radius-full); overflow: hidden; }
    .meter-fill { height: 100%; border-radius: var(--border-radius-full); }

    /* Perf Table */
    .perf-table { display: flex; flex-direction: column; }
    .table-head {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1.5fr;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--surface-border);
    }
    .table-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1.5fr;
      gap: 1rem;
      padding: 0.75rem;
      align-items: center;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      &:last-child { border-bottom: none; }
    }
    .member-cell { display: flex; align-items: center; gap: 0.6rem; }
    .font-weight-600 { font-weight: 600; }
    .text-xs { font-size: 0.75rem; }

    .health-pill { display: flex; align-items: center; gap: 0.5rem; }
    .health-bar { flex: 1; height: 6px; background: var(--surface-hover); border-radius: var(--border-radius-full); overflow: hidden; }
    .health-fill { height: 100%; border-radius: var(--border-radius-full); }
    .health-text { font-size: 0.75rem; font-weight: 700; width: 36px; text-align: right; }
  `],
})
export class ReportsComponent implements OnInit {
  private store = inject(Store);
  private teamService = inject(TeamService);

  allTasks = this.store.selectSignal(selectAllTasks);
  metrics = this.store.selectSignal(selectDashboardMetrics);
  members = signal(this.teamService.members);
  timeframe = signal<'week' | 'month' | 'all'>('week');

  ngOnInit(): void {
    this.teamService.members$.subscribe((m) => this.members.set(m));
  }

  statusDistribution = computed(() => {
    const tasks = this.allTasks();
    const total = tasks.length || 1;
    const colors: Record<string, string> = {
      new: '#6366f1', assigned: '#8b5cf6', in_progress: '#3b82f6',
      on_hold: '#f59e0b', blocked: '#ef4444', ready_for_review: '#ec4899',
      completed: '#10b981', cancelled: '#64748b',
    };
    const labels: Record<string, string> = {
      new: 'New', assigned: 'Assigned', in_progress: 'In Progress',
      on_hold: 'On Hold', blocked: 'Blocked', ready_for_review: 'Review',
      completed: 'Completed', cancelled: 'Cancelled',
    };

    const counts: Record<string, number> = {};
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1; });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      label: labels[status] || status,
      count,
      percent: Math.round((count / total) * 100),
      color: colors[status] || '#6366f1',
    }));
  });

  priorityDistribution = computed(() => {
    const tasks = this.allTasks();
    const total = tasks.length || 1;
    const colors: Record<string, string> = {
      critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981',
    };
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => { counts[t.priority] = (counts[t.priority] ?? 0) + 1; });

    return Object.entries(counts).map(([priority, count]) => ({
      priority,
      count,
      percent: Math.round((count / total) * 100),
      color: colors[priority] || '#6366f1',
    }));
  });

  getMemberStats(userId: string) {
    const tasks = this.allTasks().filter((t) => t.assigneeIds?.includes(userId));
    return {
      total: tasks.length,
      active: tasks.filter((t) => t.status === 'in_progress').length,
      blocked: tasks.filter((t) => t.isBlocked).length,
    };
  }

  getMemberUtilization(member: { id: string; capacity?: number }): number {
    const stats = this.getMemberStats(member.id);
    const maxCap = member.capacity || 5;
    const util = Math.round(((stats.active + stats.blocked * 1.5) / maxCap) * 100);
    return Math.min(util, 100);
  }

  getHealthColor(util: number): string {
    if (util >= 90) return '#ef4444';
    if (util >= 70) return '#f59e0b';
    return '#10b981';
  }

  onExportData(format: 'json' | 'csv'): void {
    const tasks = this.allTasks();
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute('href', dataStr);
      anchor.setAttribute('download', `followup_report_${Date.now()}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } else {
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Progress%'];
      const rows = tasks.map((t) => [t.id, `"${t.title}"`, t.status, t.priority, t.progressPercent]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const anchor = document.createElement('a');
      anchor.setAttribute('href', encodeURI(csvContent));
      anchor.setAttribute('download', `followup_report_${Date.now()}.csv`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  }
}
