import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../../../core/services/standup.service';
import { TeamService } from '../../../core/services/team.service';
import { Standup } from '../../../core/models/shared.model';

@Component({
  selector: 'app-standup-review',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Daily Follow-up & Standup Review</h1>
          <p class="text-secondary">Project Manager Hub: Review team progress, respond to blockers, and leave feedback</p>
        </div>
        <div class="header-actions">
          <a routerLink="/dashboard/my-workspace" class="btn btn--secondary btn--sm">
            <span class="material-icons-round">edit_note</span> Submit My Standup
          </a>
        </div>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="metrics-row stagger">
        <div class="card metric-box">
          <span class="metric-val text-primary">{{ standups().length }}</span>
          <span class="metric-lbl">Standups Today</span>
        </div>
        <div class="card metric-box">
          <span class="metric-val text-danger">{{ blockerCount() }}</span>
          <span class="metric-lbl">Active Blockers</span>
        </div>
        <div class="card metric-box">
          <span class="metric-val text-warning">{{ escalatedCount() }}</span>
          <span class="metric-lbl">Escalated Requests</span>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="standup-tabs">
        <button
          class="tab"
          [class.active]="filter() === 'all'"
          (click)="filter.set('all')"
        >All Standups ({{ standups().length }})</button>

        <button
          class="tab tab--danger"
          [class.active]="filter() === 'blockers'"
          (click)="filter.set('blockers')"
        >
          <span class="material-icons-round">block</span>
          Blockers Only ({{ blockerCount() }})
        </button>
      </div>

      <!-- Standup Cards Feed -->
      <div class="standup-feed">
        @for (item of filteredStandups(); track item.id) {
          <div class="card standup-card" [class.standup-card--blocked]="item.blockers">
            <div class="standup-card__header">
              <div class="user-meta">
                <div class="avatar avatar--md avatar--initials">
                  {{ getUserName(item.userId).charAt(0) }}
                </div>
                <div>
                  <h4 class="user-name">{{ getUserName(item.userId) }}</h4>
                  <span class="user-role text-muted">{{ getUserRole(item.userId) }}</span>
                </div>
              </div>

              <div class="header-badges">
                @if (item.blockers) {
                  <span class="badge badge--blocked">
                    <span class="material-icons-round">error</span> Blocker
                  </span>
                }
                <span class="progress-badge">
                  Progress: <strong>{{ item.progressPercent }}%</strong>
                </span>
              </div>
            </div>

            <div class="standup-body">
              <!-- Completed -->
              <div class="content-block">
                <span class="block-title title-done">
                  <span class="material-icons-round">check_circle</span> Completed Today
                </span>
                <p class="block-text">{{ item.completed }}</p>
              </div>

              <!-- Planned -->
              <div class="content-block">
                <span class="block-title title-next">
                  <span class="material-icons-round">arrow_forward</span> Planned Next
                </span>
                <p class="block-text">{{ item.planned || 'No planned items logged.' }}</p>
              </div>

              <!-- Blockers (if any) -->
              @if (item.blockers) {
                <div class="content-block block-danger">
                  <div class="blocker-header">
                    <span class="block-title title-blocked">
                      <span class="material-icons-round">block</span> Active Blocker
                    </span>
                    <button class="btn btn--secondary btn--xs" (click)="onClearBlocker(item.id)">
                      <span class="material-icons-round">task_alt</span> Mark Unblocked
                    </button>
                  </div>
                  <p class="block-text text-danger-dark">{{ item.blockers }}</p>
                  @if (item.helpNeeded) {
                    <p class="help-needed"><strong>Help Request:</strong> {{ item.helpNeeded }}</p>
                  }
                </div>
              }

              <!-- PM Manager Comment Section -->
              <div class="pm-comment-section">
                @if (item.managerComment) {
                  <div class="existing-comment">
                    <span class="comment-author">
                      <span class="material-icons-round">forum</span>
                      PM Feedback ({{ item.managerCommentBy }}):
                    </span>
                    <p class="comment-text">{{ item.managerComment }}</p>
                  </div>
                }

                <div class="add-comment-row">
                  <input
                    type="text"
                    class="input input--sm comment-input"
                    placeholder="Leave feedback or instructions for team member..."
                    [(ngModel)]="commentInputs[item.id]"
                    (keyup.enter)="onSaveComment(item.id)"
                  />
                  <button class="btn btn--primary btn--sm" (click)="onSaveComment(item.id)">
                    <span class="material-icons-round">send</span> Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        @if (filteredStandups().length === 0) {
          <div class="card empty-card">
            <span class="material-icons-round">event_note</span>
            <h3>No standups match the selected filter</h3>
            <p class="text-muted">Change filter to view all standups.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; }
    .header-actions { display: flex; gap: 0.75rem; }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-box {
      padding: 1.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }
    .metric-val { font-size: 1.8rem; font-weight: 800; }
    .metric-lbl { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }

    .standup-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 1rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: var(--transition-fast);

      &.active {
        background: rgba(99,102,241,0.15);
        border-color: var(--color-primary);
        color: var(--color-primary-light);
        font-weight: 600;
      }
      &--danger.active {
        background: rgba(239,68,68,0.15);
        border-color: var(--color-danger);
        color: var(--color-danger);
      }

      .material-icons-round { font-size: 1rem; }
    }

    .standup-feed { display: flex; flex-direction: column; gap: 1.25rem; }

    .standup-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: var(--transition-fast);

      &--blocked {
        border-color: rgba(239,68,68,0.4);
        background: rgba(239,68,68,0.02);
      }
    }

    .standup-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--surface-border);
      padding-bottom: 0.75rem;
    }

    .user-meta { display: flex; align-items: center; gap: 0.75rem; }
    .user-name { font-size: 1rem; font-weight: 600; }
    .user-role { font-size: 0.75rem; }

    .header-badges { display: flex; align-items: center; gap: 0.75rem; }
    .progress-badge { font-size: 0.8rem; color: var(--text-secondary); }

    .standup-body { display: flex; flex-direction: column; gap: 0.9rem; }

    .content-block {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .block-title {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;

      .material-icons-round { font-size: 0.95rem; }
    }
    .title-done { color: var(--color-success); }
    .title-next { color: var(--color-primary-light); }
    .title-blocked { color: var(--color-danger); }

    .block-text { font-size: 0.875rem; line-height: 1.5; color: var(--text-primary); }

    .block-danger {
      padding: 0.875rem;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--border-radius-sm);
    }
    .blocker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .help-needed { font-size: 0.8rem; color: var(--color-warning); margin-top: 0.3rem; }

    .pm-comment-section {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--surface-border);
    }

    .existing-comment {
      padding: 0.65rem 0.85rem;
      background: rgba(99,102,241,0.08);
      border-left: 3px solid var(--color-primary);
      border-radius: var(--border-radius-sm);
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .comment-author { font-size: 0.75rem; font-weight: 700; color: var(--color-primary-light); display: flex; align-items: center; gap: 0.3rem; .material-icons-round { font-size: 0.85rem; } }
    .comment-text { font-size: 0.85rem; color: var(--text-primary); }

    .add-comment-row { display: flex; gap: 0.5rem; }
    .comment-input { flex: 1; }

    .btn--xs { padding: 0.2rem 0.5rem; font-size: 0.72rem; }

    .empty-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      gap: 0.5rem;
      text-align: center;
      .material-icons-round { font-size: 3rem; opacity: 0.4; color: var(--text-muted); }
    }
  `],
})
export class StandupReviewComponent implements OnInit {
  private standupService = inject(StandupService);
  private teamService = inject(TeamService);

  standups = signal<Standup[]>([]);
  filter = signal<'all' | 'blockers'>('all');
  commentInputs: Record<string, string> = {};

  ngOnInit(): void {
    this.standupService.standups$.subscribe((items) => this.standups.set(items));
  }

  getUserName(userId: string): string {
    const member = this.teamService.members.find((m) => m.id === userId);
    return member?.displayName || 'Team Member';
  }

  getUserRole(userId: string): string {
    const member = this.teamService.members.find((m) => m.id === userId);
    return member?.departmentId || 'Engineering';
  }

  filteredStandups(): Standup[] {
    if (this.filter() === 'blockers') {
      return this.standups().filter((s) => s.blockers);
    }
    return this.standups();
  }

  blockerCount(): number {
    return this.standups().filter((s) => s.blockers).length;
  }

  escalatedCount(): number {
    return this.standups().filter((s) => s.isEscalated).length;
  }

  onClearBlocker(id: string): void {
    this.standupService.clearBlocker(id);
  }

  onSaveComment(id: string): void {
    const text = this.commentInputs[id];
    if (!text || !text.trim()) return;
    this.standupService.addManagerComment(id, text.trim(), 'Project Manager');
    this.commentInputs[id] = '';
  }
}
