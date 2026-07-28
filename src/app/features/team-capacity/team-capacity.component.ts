import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamService } from '../../core/services/team.service';
import { UserProfile, UserRole } from '../../core/models/user.model';
import { Store } from '@ngrx/store';
import { selectAllTasks } from '../../store/tasks/tasks.selectors';

@Component({
  selector: 'app-team-capacity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Team & Workload Management</h1>
          <p class="text-secondary">Project Manager Hub: Add team members, monitor daily capacity, and balance workload</p>
        </div>
        <div class="header-actions">
          <button class="btn btn--primary" (click)="showAddMemberModal.set(true)">
            <span class="material-icons-round">person_add</span>
            Add Team Member
          </button>
        </div>
      </div>

      <!-- Capacity Summary Cards -->
      <div class="summary-grid stagger">
        <div class="card summary-card">
          <div class="summary-icon icon-indigo">
            <span class="material-icons-round">groups</span>
          </div>
          <div>
            <span class="summary-val">{{ members().length }}</span>
            <span class="summary-lbl">Team Members</span>
          </div>
        </div>

        <div class="card summary-card">
          <div class="summary-icon icon-amber">
            <span class="material-icons-round">speed</span>
          </div>
          <div>
            <span class="summary-val">{{ avgUtilization() }}%</span>
            <span class="summary-lbl">Avg Team Capacity</span>
          </div>
        </div>

        <div class="card summary-card">
          <div class="summary-icon icon-rose">
            <span class="material-icons-round">error_outline</span>
          </div>
          <div>
            <span class="summary-val">{{ overloadedCount() }}</span>
            <span class="summary-lbl">Overloaded Members</span>
          </div>
        </div>

        <div class="card summary-card">
          <div class="summary-icon icon-emerald">
            <span class="material-icons-round">check_circle_outline</span>
          </div>
          <div>
            <span class="summary-val">{{ activeTasksCount() }}</span>
            <span class="summary-lbl">Active Tasks Assigned</span>
          </div>
        </div>
      </div>

      <!-- Member Grid -->
      <div class="capacity-grid">
        @for (member of members(); track member.id) {
          <div class="card capacity-card" [class.overloaded]="getMemberUtilization(member) >= 90">
            <div class="capacity-card__header">
              <div class="avatar avatar--md avatar--initials">
                {{ getInitials(member.displayName) }}
              </div>
              <div class="member-info">
                <span class="member-name">{{ member.displayName }}</span>
                <span class="member-role text-muted">{{ formatRole(member.role) }} • {{ member.departmentId }}</span>
              </div>
              <div class="member-actions">
                <button
                  class="btn btn--icon btn--sm"
                  title="Remove Member"
                  (click)="onRemoveMember(member.id, member.displayName)"
                >
                  <span class="material-icons-round text-danger">delete_outline</span>
                </button>
              </div>
            </div>

            <div class="capacity-meter-wrap">
              <div class="capacity-meter-lbl">
                <span>Daily Workload Utilization</span>
                <span class="util-badge" [style.color]="getMeterColor(getMemberUtilization(member))">
                  {{ getMemberUtilization(member) }}%
                </span>
              </div>
              <div class="capacity-meter">
                <div class="meter-bar">
                  <div
                    class="meter-fill"
                    [style.width.%]="getMemberUtilization(member)"
                    [style.background]="getMeterColor(getMemberUtilization(member))"
                  ></div>
                </div>
              </div>
            </div>

            <div class="capacity-stats">
              <div class="cap-stat">
                <span>{{ getMemberTaskCount(member.id).total }}</span> Total
              </div>
              <div class="cap-stat">
                <span class="text-primary">{{ getMemberTaskCount(member.id).inProgress }}</span> Active
              </div>
              <div class="cap-stat">
                <span class="text-danger">{{ getMemberTaskCount(member.id).blocked }}</span> Blocked
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Add Member Modal -->
      @if (showAddMemberModal()) {
        <div class="modal-overlay" (click)="showAddMemberModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><span class="material-icons-round">person_add</span> Add New Team Member</h3>
              <button class="btn btn--icon" (click)="showAddMemberModal.set(false)">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="addMemberForm" (ngSubmit)="onAddMemberSubmit()" class="modal-form">
              <div class="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  class="input"
                  formControlName="displayName"
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  class="input"
                  formControlName="email"
                  placeholder="alex.m@company.com"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Role *</label>
                  <select class="input" formControlName="role">
                    <option value="employee">Developer / Employee</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="project_manager">Project Manager</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Department / Team *</label>
                  <select class="input" formControlName="departmentId">
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Max Daily Task Capacity *</label>
                <input
                  type="number"
                  class="input"
                  formControlName="capacity"
                  min="1"
                  max="10"
                />
                <span class="field-hint">Default recommended capacity: 5 active tasks</span>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn--secondary" (click)="showAddMemberModal.set(false)">
                  Cancel
                </button>
                <button type="submit" class="btn btn--primary" [disabled]="addMemberForm.invalid">
                  <span class="material-icons-round">add</span> Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
    }

    .summary-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      .material-icons-round { font-size: 1.4rem; color: #fff; }
    }
    .icon-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .icon-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .icon-rose { background: linear-gradient(135deg, #f43f5e, #e11d48); }
    .icon-emerald { background: linear-gradient(135deg, #10b981, #059669); }

    .summary-val { font-size: 1.6rem; font-weight: 800; display: block; line-height: 1; margin-bottom: 0.2rem; }
    .summary-lbl { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; }

    .capacity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .capacity-card {
      transition: var(--transition-normal);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      &.overloaded { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.03); }
    }

    .capacity-card__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .member-info { flex: 1; display: flex; flex-direction: column; }
    .member-name { font-weight: 600; font-size: 0.95rem; }
    .member-role { font-size: 0.75rem; color: var(--text-muted); }

    .capacity-meter-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
    .capacity-meter-lbl {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }
    .util-badge { font-weight: 700; }

    .capacity-meter {
      height: 8px;
      background: var(--surface-hover);
      border-radius: var(--border-radius-full);
      overflow: hidden;
    }

    .meter-bar { height: 100%; width: 100%; }
    .meter-fill { height: 100%; border-radius: var(--border-radius-full); transition: width 400ms ease; }

    .capacity-stats {
      display: flex;
      border-top: 1px solid var(--surface-border);
      padding-top: 0.75rem;
    }

    .cap-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;

      span { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
      &:not(:last-child) { border-right: 1px solid var(--surface-border); }
    }

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
    }

    .modal-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-lg);
      width: 100%;
      max-width: 520px;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      h3 { font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    }

    .modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
      select.input { cursor: pointer; option { background: var(--surface-card); } }
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field-hint { font-size: 0.72rem; color: var(--text-muted); }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
      margin-top: 0.5rem;
    }
  `],
})
export class TeamCapacityComponent implements OnInit {
  private teamService = inject(TeamService);
  private store = inject(Store);
  private fb = inject(FormBuilder);

  allTasks = this.store.selectSignal(selectAllTasks);
  members = signal<UserProfile[]>([]);
  showAddMemberModal = signal(false);

  addMemberForm = this.fb.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['employee' as UserRole, Validators.required],
    departmentId: ['Engineering', Validators.required],
    capacity: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  ngOnInit(): void {
    this.teamService.members$.subscribe((m) => this.members.set(m));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatRole(role: string): string {
    const roles: Record<string, string> = {
      admin: 'Admin',
      project_manager: 'Project Manager',
      team_lead: 'Team Lead',
      employee: 'Developer',
    };
    return roles[role] || role;
  }

  getMemberTaskCount(userId: string) {
    const userTasks = this.allTasks().filter((t) => t.assigneeIds?.includes(userId));
    return {
      total: userTasks.length,
      inProgress: userTasks.filter((t) => t.status === 'in_progress').length,
      blocked: userTasks.filter((t) => t.isBlocked).length,
    };
  }

  getMemberUtilization(member: UserProfile): number {
    const count = this.getMemberTaskCount(member.id);
    const maxCap = member.capacity || 5;
    const util = Math.round(((count.inProgress + count.blocked * 1.5) / maxCap) * 100);
    return Math.min(util, 100);
  }

  avgUtilization(): number {
    if (this.members().length === 0) return 0;
    const total = this.members().reduce((sum, m) => sum + this.getMemberUtilization(m), 0);
    return Math.round(total / this.members().length);
  }

  overloadedCount(): number {
    return this.members().filter((m) => this.getMemberUtilization(m) >= 90).length;
  }

  activeTasksCount(): number {
    return this.allTasks().filter((t) => t.status === 'in_progress').length;
  }

  getMeterColor(util: number): string {
    if (util >= 90) return '#ef4444';
    if (util >= 70) return '#f59e0b';
    return '#10b981';
  }

  onAddMemberSubmit(): void {
    if (this.addMemberForm.invalid) return;
    const v = this.addMemberForm.value;
    this.teamService.addMember({
      displayName: v.displayName!,
      email: v.email!,
      role: v.role as UserRole,
      departmentId: v.departmentId!,
      capacity: Number(v.capacity) || 5,
    });
    this.addMemberForm.reset({ role: 'employee', departmentId: 'Engineering', capacity: 5 });
    this.showAddMemberModal.set(false);
  }

  onRemoveMember(id: string, name: string): void {
    if (confirm(`Remove ${name} from the team?`)) {
      this.teamService.removeMember(id);
    }
  }
}
