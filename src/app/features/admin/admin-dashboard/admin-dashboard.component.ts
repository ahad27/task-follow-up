import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../core/services/team.service';
import { UserProfile, UserRole } from '../../../core/models/user.model';

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: Date;
  status: 'success' | 'warning';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">System Admin Panel</h1>
          <p class="text-secondary">Manage user permissions, security roles, system configuration, and audit logs</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
          <span class="material-icons-round">people</span> User Directory & Roles
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit')">
          <span class="material-icons-round">history</span> Audit Logs
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'settings'" (click)="activeTab.set('settings')">
          <span class="material-icons-round">settings</span> Platform Settings
        </button>
      </div>

      <!-- USERS TAB -->
      @if (activeTab() === 'users') {
        <div class="card admin-card">
          <div class="card-header">
            <h3><span class="material-icons-round text-primary">manage_accounts</span> System Users & Access Control</h3>
            <span class="badge badge--assigned">{{ members().length }} Registered Users</span>
          </div>

          <div class="table-wrap">
            <div class="table-head">
              <span>User</span>
              <span>Email</span>
              <span>Role / Permissions</span>
              <span>Department</span>
              <span>Status</span>
            </div>
            @for (u of members(); track u.id) {
              <div class="table-row">
                <div class="user-cell">
                  <div class="avatar avatar--sm avatar--initials">{{ u.displayName.charAt(0) }}</div>
                  <span class="font-weight-600">{{ u.displayName }}</span>
                </div>
                <span class="text-muted text-xs">{{ u.email }}</span>
                <div>
                  <select class="role-select" [value]="u.role" (change)="onRoleChange(u.id, $event)">
                    <option value="admin">👑 Project Manager / Admin</option>
                    <option value="team_lead">⚡ Team Lead</option>
                    <option value="employee">👤 Developer / Employee</option>
                  </select>
                </div>
                <span class="text-xs">{{ u.departmentId }}</span>
                <div>
                  <span class="badge badge--completed">Active</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- AUDIT LOGS TAB -->
      @if (activeTab() === 'audit') {
        <div class="card admin-card">
          <div class="card-header">
            <h3><span class="material-icons-round text-primary">history</span> System Audit Trail</h3>
            <span class="text-muted text-xs">Security & Action Logs</span>
          </div>

          <div class="audit-list">
            @for (log of auditLogs(); track log.id) {
              <div class="audit-row">
                <span class="material-icons-round audit-icon">info</span>
                <div class="audit-details">
                  <span class="audit-action">
                    <strong>{{ log.actor }}</strong> {{ log.action }} <em>{{ log.target }}</em>
                  </span>
                  <span class="audit-time text-muted text-xs">{{ log.timestamp | date: 'MMM dd, yyyy HH:mm:ss' }}</span>
                </div>
                <span class="badge badge--sm" [class.badge--completed]="log.status === 'success'" [class.badge--on-hold]="log.status === 'warning'">
                  {{ log.status }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- SETTINGS TAB -->
      @if (activeTab() === 'settings') {
        <div class="card admin-card">
          <div class="card-header">
            <h3><span class="material-icons-round text-primary">tune</span> Platform Configuration</h3>
          </div>

          <div class="settings-list">
            <div class="setting-item">
              <div>
                <span class="setting-title">Auto-Escalate Blocked Tasks</span>
                <span class="setting-desc text-muted">Automatically notify PM if a task stays blocked for over 24 hours</span>
              </div>
              <input type="checkbox" checked class="toggle" />
            </div>

            <div class="setting-item">
              <div>
                <span class="setting-title">Daily Standup Reminder Email</span>
                <span class="setting-desc text-muted">Send automatic reminder email to team at 09:00 AM daily</span>
              </div>
              <input type="checkbox" checked class="toggle" />
            </div>

            <div class="setting-item">
              <div>
                <span class="setting-title">Allow Team Lead Task Creation</span>
                <span class="setting-desc text-muted">Grant Team Leads permission to assign tasks within their department</span>
              </div>
              <input type="checkbox" checked class="toggle" />
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }

    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 1rem;
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
      .material-icons-round { font-size: 1rem; }
    }

    .admin-card { display: flex; flex-direction: column; gap: 1.25rem; }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--surface-border);
      padding-bottom: 0.75rem;
      h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; }
    }

    .table-wrap { display: flex; flex-direction: column; }
    .table-head {
      display: grid;
      grid-template-columns: 2fr 2fr 2fr 1.5fr 1fr;
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
      grid-template-columns: 2fr 2fr 2fr 1.5fr 1fr;
      gap: 1rem;
      padding: 0.75rem;
      align-items: center;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      &:last-child { border-bottom: none; }
    }

    .user-cell { display: flex; align-items: center; gap: 0.6rem; }
    .font-weight-600 { font-weight: 600; }
    .text-xs { font-size: 0.75rem; }
    .text-primary { color: var(--color-primary); }

    .role-select {
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      color: var(--text-primary);
      border-radius: var(--border-radius-sm);
      font-size: 0.8rem;
      padding: 0.3rem 0.5rem;
      outline: none;
      option { background: var(--surface-card); }
    }

    .audit-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .audit-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
    }
    .audit-icon { font-size: 1.1rem; color: var(--color-primary-light); }
    .audit-details { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .audit-action { font-size: 0.85rem; strong { color: var(--text-primary); } }

    .settings-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--surface-border);
      &:last-child { border-bottom: none; }
    }
    .setting-title { font-size: 0.9rem; font-weight: 600; display: block; margin-bottom: 0.2rem; }
    .setting-desc { font-size: 0.8rem; }
    .toggle { width: 40px; height: 20px; accent-color: var(--color-primary); cursor: pointer; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private teamService = inject(TeamService);

  members = signal(this.teamService.members);
  activeTab = signal<'users' | 'audit' | 'settings'>('users');

  auditLogs = signal<AuditLog[]>([
    { id: 'al-1', actor: 'Project Manager', action: 'assigned task #104 to', target: 'John Miller', timestamp: new Date(Date.now() - 1800000), status: 'success' },
    { id: 'al-2', actor: 'Sarah Jenkins', action: 'submitted daily standup for', target: 'Frontend Team', timestamp: new Date(Date.now() - 7200000), status: 'success' },
    { id: 'al-3', actor: 'Ahmed Hassan', action: 'escalated blocker on', target: 'CI/CD Pipeline', timestamp: new Date(Date.now() - 14400000), status: 'warning' },
    { id: 'al-4', actor: 'Admin System', action: 'updated role permissions for', target: 'Alex Morgan', timestamp: new Date(Date.now() - 86400000), status: 'success' },
  ]);

  ngOnInit(): void {
    this.teamService.members$.subscribe((m) => this.members.set(m));
  }

  onRoleChange(userId: string, event: Event): void {
    const newRole = (event.target as HTMLSelectElement).value as UserRole;
    // Update local state if needed
    console.log(`Updated role for ${userId} to ${newRole}`);
  }
}
