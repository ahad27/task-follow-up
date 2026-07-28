import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamService } from '../../core/services/team.service';
import { HelpRequest } from '../../core/models/shared.model';
import { Store } from '@ngrx/store';
import { selectAllTasks } from '../../store/tasks/tasks.selectors';

@Component({
  selector: 'app-help-escalation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Help & Blocker Escalations</h1>
          <p class="text-secondary">Track assistance requests, assign helper engineers, and clear project blockers</p>
        </div>
        <div class="header-actions">
          <button class="btn btn--primary" (click)="showRequestModal.set(true)">
            <span class="material-icons-round">support_agent</span>
            Request Help / Escalation
          </button>
        </div>
      </div>

      <!-- Quick Status Row -->
      <div class="stats-row stagger">
        <div class="card stat-card">
          <span class="stat-val text-warning">{{ openRequests().length }}</span>
          <span class="stat-lbl">Open Help Requests</span>
        </div>
        <div class="card stat-card">
          <span class="stat-val text-primary">{{ assignedRequests().length }}</span>
          <span class="stat-lbl">In-Progress Assistance</span>
        </div>
        <div class="card stat-card">
          <span class="stat-val text-success">{{ resolvedRequests().length }}</span>
          <span class="stat-lbl">Resolved Requests</span>
        </div>
      </div>

      <div class="help-grid">
        <!-- Open & Assigned Requests Column -->
        <div class="card column-card">
          <div class="column-header">
            <h3><span class="material-icons-round text-warning">warning</span> Active Assistance Requests</h3>
            <span class="badge badge--blocked">{{ activeRequests().length }} active</span>
          </div>

          @if (activeRequests().length === 0) {
            <div class="empty-state">
              <span class="material-icons-round text-success" style="font-size: 2.5rem">check_circle</span>
              <p class="font-weight-600">No active blockers!</p>
              <p class="text-muted text-xs">All team members are currently unblocked.</p>
            </div>
          } @else {
            <div class="request-list">
              @for (req of activeRequests(); track req.id) {
                <div class="request-card" [class.request-card--assigned]="req.status === 'assigned'">
                  <div class="request-header">
                    <span class="badge" [class.badge--critical]="req.status === 'open'" [class.badge--in-progress]="req.status === 'assigned'">
                      {{ req.status === 'open' ? 'Needs Helper' : 'Assigned' }}
                    </span>
                    <span class="text-muted text-xs">{{ req.createdAt | date: 'MMM dd, HH:mm' }}</span>
                  </div>

                  <p class="request-desc">{{ req.description }}</p>

                  <div class="request-meta">
                    <span class="requester">
                      <span class="material-icons-round">person</span>
                      Requested by: <strong>{{ getMemberName(req.requesterId) }}</strong>
                    </span>
                    @if (req.assignedHelperId) {
                      <span class="helper">
                        <span class="material-icons-round text-primary">engineering</span>
                        Helper: <strong>{{ getMemberName(req.assignedHelperId) }}</strong>
                      </span>
                    }
                  </div>

                  <div class="request-actions">
                    @if (req.status === 'open') {
                      <select class="select-xs" (change)="onAssignHelper(req.id, $event)">
                        <option value="">Assign Helper...</option>
                        @for (m of members(); track m.id) {
                          <option [value]="m.id">{{ m.displayName }} ({{ m.departmentId }})</option>
                        }
                      </select>
                    }
                    <button class="btn btn--secondary btn--xs" (click)="onResolveRequest(req.id)">
                      <span class="material-icons-round">task_alt</span> Mark Resolved
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Resolved History Column -->
        <div class="card column-card">
          <div class="column-header">
            <h3><span class="material-icons-round text-success">history</span> Resolved Escalations Archive</h3>
            <span class="badge badge--completed">{{ resolvedRequests().length }} resolved</span>
          </div>

          @if (resolvedRequests().length === 0) {
            <div class="empty-state">
              <span class="material-icons-round" style="font-size: 2.5rem; opacity: 0.4">history</span>
              <p class="text-muted">Resolved escalation records will appear here.</p>
            </div>
          } @else {
            <div class="request-list">
              @for (req of resolvedRequests(); track req.id) {
                <div class="request-card request-card--resolved">
                  <div class="request-header">
                    <span class="badge badge--completed">Resolved</span>
                    <span class="text-muted text-xs">Resolved {{ req.resolvedAt | date: 'MMM dd' }}</span>
                  </div>
                  <p class="request-desc text-muted">{{ req.description }}</p>
                  <div class="request-meta">
                    <span class="text-xs text-muted">Requested by: {{ getMemberName(req.requesterId) }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Request Help Modal -->
      @if (showRequestModal()) {
        <div class="modal-overlay" (click)="showRequestModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><span class="material-icons-round text-warning">support_agent</span> Request Technical Help</h3>
              <button class="btn btn--icon" (click)="showRequestModal.set(false)">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="helpForm" (ngSubmit)="onSubmitRequest()" class="modal-form">
              <div class="form-group">
                <label>Requester *</label>
                <select class="input" formControlName="requesterId">
                  @for (m of members(); track m.id) {
                    <option [value]="m.id">{{ m.displayName }} ({{ m.departmentId }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Description of Issue / Blocker *</label>
                <textarea
                  class="input"
                  formControlName="description"
                  rows="4"
                  placeholder="Describe the blocker or technical issue you need assistance with..."
                ></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn--secondary" (click)="showRequestModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn--primary" [disabled]="helpForm.invalid">
                  <span class="material-icons-round">send</span> Submit Request
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
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }
    .header-actions { display: flex; gap: 0.75rem; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      padding: 1.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }
    .stat-val { font-size: 1.8rem; font-weight: 800; }
    .stat-lbl { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }

    .text-warning { color: #f59e0b; }
    .text-primary { color: #3b82f6; }
    .text-success { color: #10b981; }

    .help-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;

      @media (max-width: 1024px) { grid-template-columns: 1fr; }
    }

    .column-card { display: flex; flex-direction: column; gap: 1rem; }
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--surface-border);
      padding-bottom: 0.75rem;
      h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; }
    }

    .request-list { display: flex; flex-direction: column; gap: 0.85rem; }

    .request-card {
      padding: 1rem;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      &--assigned { border-color: rgba(99,102,241,0.4); }
      &--resolved { opacity: 0.75; }
    }

    .request-header { display: flex; justify-content: space-between; align-items: center; }
    .request-desc { font-size: 0.875rem; line-height: 1.5; color: var(--text-primary); }

    .request-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.78rem;
      color: var(--text-secondary);

      .requester, .helper { display: flex; align-items: center; gap: 0.35rem; .material-icons-round { font-size: 0.9rem; } }
    }

    .request-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.25rem; }
    .select-xs {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-primary);
      border-radius: var(--border-radius-sm);
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      outline: none;
      option { background: var(--surface-card); }
    }

    .btn--xs { padding: 0.25rem 0.6rem; font-size: 0.72rem; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem;
      gap: 0.5rem;
      text-align: center;
      color: var(--text-muted);
    }
    .font-weight-600 { font-weight: 600; }
    .text-xs { font-size: 0.75rem; }

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
      max-width: 500px;
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
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; } select.input { cursor: pointer; option { background: var(--surface-card); } } }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--surface-border); padding-top: 0.75rem; }
  `],
})
export class HelpEscalationComponent implements OnInit {
  private teamService = inject(TeamService);
  private fb = inject(FormBuilder);

  members = signal(this.teamService.members);
  showRequestModal = signal(false);

  requests = signal<HelpRequest[]>([
    {
      id: 'hr-1',
      requesterId: 'usr-2',
      taskId: 'task-1',
      teamId: 'team-frontend',
      description: 'Staging environment auth token expiring intermittently during API calls.',
      status: 'assigned',
      assignedHelperId: 'usr-5',
      createdAt: new Date(Date.now() - 3600000 * 4),
    },
    {
      id: 'hr-2',
      requesterId: 'usr-4',
      taskId: 'task-2',
      teamId: 'team-qa',
      description: 'Need review on automated regression pipeline config in CI/CD pipeline.',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
  ]);

  helpForm = this.fb.group({
    requesterId: ['usr-2', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.teamService.members$.subscribe((m) => this.members.set(m));
  }

  getMemberName(id: string): string {
    const m = this.members().find((mem) => mem.id === id);
    return m?.displayName || 'Team Member';
  }

  activeRequests() {
    return this.requests().filter((r) => r.status !== 'resolved');
  }

  openRequests() {
    return this.requests().filter((r) => r.status === 'open');
  }

  assignedRequests() {
    return this.requests().filter((r) => r.status === 'assigned');
  }

  resolvedRequests() {
    return this.requests().filter((r) => r.status === 'resolved');
  }

  onAssignHelper(reqId: string, event: Event): void {
    const helperId = (event.target as HTMLSelectElement).value;
    if (!helperId) return;

    const updated = this.requests().map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'assigned' as const,
          assignedHelperId: helperId,
        };
      }
      return r;
    });
    this.requests.set(updated);
  }

  onResolveRequest(reqId: string): void {
    const updated = this.requests().map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'resolved' as const,
          resolvedAt: new Date(),
        };
      }
      return r;
    });
    this.requests.set(updated);
  }

  onSubmitRequest(): void {
    if (this.helpForm.invalid) return;
    const v = this.helpForm.value;

    const newReq: HelpRequest = {
      id: 'hr-' + Date.now(),
      requesterId: v.requesterId!,
      taskId: 'task-gen',
      teamId: 'team-main',
      description: v.description!,
      status: 'open',
      createdAt: new Date(),
    };

    this.requests.set([newReq, ...this.requests()]);
    this.helpForm.reset({ requesterId: 'usr-2' });
    this.showRequestModal.set(false);
  }
}
