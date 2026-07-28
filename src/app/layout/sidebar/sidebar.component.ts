import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { selectAllTasks } from '../../store/tasks/tasks.selectors';
import { StandupService } from '../../core/services/standup.service';

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  badgeSignal?: () => number | string | null;
  badgeClass?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Sidebar Header / Logo -->
      <div class="sidebar__logo">
        <div class="logo-icon">
          <span class="material-icons-round">task_alt</span>
        </div>
        <div class="logo-details" *ngIf="!collapsed">
          <span class="logo-title">FollowUp</span>
          <span class="logo-subtitle">PM & Team Portal</span>
        </div>
      </div>

      <!-- Sidebar Navigation Menu -->
      <nav class="sidebar__nav">
        @for (section of navSections(); track section.title || $index) {
          <div class="nav-section">
            @if (section.title && !collapsed) {
              <div class="section-heading">{{ section.title }}</div>
            }

            <ul class="nav-list">
              @for (item of section.items; track item.route) {
                <li>
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: !!item.exact }"
                    class="nav-item"
                    [title]="collapsed ? item.label : ''"
                  >
                    <span class="material-icons-round nav-icon">{{ item.icon }}</span>

                    @if (!collapsed) {
                      <span class="nav-label">{{ item.label }}</span>
                      @if (item.badgeSignal && item.badgeSignal() !== null) {
                        <span class="nav-badge" [class]="item.badgeClass || 'badge-primary'">
                          {{ item.badgeSignal() }}
                        </span>
                      }
                    }
                  </a>
                </li>
              }
            </ul>
          </div>
        }
      </nav>

      <!-- Sidebar Collapse Toggle Button -->
      <div class="sidebar__toggle-row">
        <button class="sidebar__toggle" (click)="toggleCollapse.emit()" [title]="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
          <span class="material-icons-round">
            {{ collapsed ? 'chevron_right' : 'chevron_left' }}
          </span>
          <span class="toggle-text" *ngIf="!collapsed">Collapse Sidebar</span>
        </button>
      </div>

      <!-- Sidebar Footer User Profile -->
      @if (currentUser(); as user) {
        <div class="sidebar__user">
          <div class="avatar avatar--sm avatar--initials">
            {{ user.displayName.charAt(0).toUpperCase() }}
          </div>
          <div class="user-info" *ngIf="!collapsed">
            <span class="user-name">{{ user.displayName }}</span>
            <span class="user-role">{{ formatRole(user.role) }}</span>
          </div>
        </div>
      }
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      background: var(--surface-card);
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      transition: width var(--transition-normal);
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      z-index: 100;

      &.collapsed {
        width: var(--sidebar-collapsed-width);
      }
    }

    /* Logo Header */
    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.1rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      min-height: 64px;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-primary), #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(99,102,241,0.35);

      .material-icons-round { font-size: 1.3rem; color: #fff; }
    }

    .logo-details {
      display: flex;
      flex-direction: column;
      white-space: nowrap;
    }

    .logo-title {
      font-size: 1.1rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.75));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
    }

    .logo-subtitle {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Navigation Sections */
    .sidebar__nav {
      flex: 1;
      padding: 0.75rem 0.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: var(--surface-border); border-radius: 4px; }
    }

    .nav-section { display: flex; flex-direction: column; gap: 0.25rem; }

    .section-heading {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.4rem 0.75rem 0.2rem;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 0;
      margin: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: var(--border-radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: var(--transition-fast);
      white-space: nowrap;
      position: relative;

      &:hover {
        background: var(--surface-elevated);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(99, 102, 241, 0.14);
        color: var(--color-primary-light);
        font-weight: 600;

        .nav-icon { color: var(--color-primary); }

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: var(--color-primary);
          border-radius: 0 3px 3px 0;
        }
      }
    }

    .nav-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

    .nav-badge {
      border-radius: var(--border-radius-full);
      padding: 0.1rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .badge-primary { background: rgba(99, 102, 241, 0.2); color: var(--color-primary-light); }
    .badge-danger { background: rgba(239, 68, 68, 0.2); color: var(--color-danger); }
    .badge-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

    /* Toggle row */
    .sidebar__toggle-row {
      padding: 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .sidebar__toggle {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.5rem 0.6rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      transition: var(--transition-fast);

      &:hover { background: var(--surface-elevated); color: var(--text-primary); }
      .material-icons-round { font-size: 1.1rem; flex-shrink: 0; }
    }

    .toggle-text { flex: 1; text-align: left; }

    /* Footer User Profile */
    .sidebar__user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--surface-border);
      background: rgba(255,255,255,0.01);

      .user-info { display: flex; flex-direction: column; overflow: hidden; }
      .user-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
      .user-role { font-size: 0.7rem; color: var(--text-muted); }
    }
  `],
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  private store = inject(Store);
  private standupService = inject(StandupService);

  currentUser = this.store.selectSignal(selectCurrentUser);
  allTasks = this.store.selectSignal(selectAllTasks);

  // Live badge counts
  totalTaskCount = computed(() => this.allTasks().length);
  blockedTaskCount = computed(() => this.allTasks().filter((t) => t.isBlocked).length);
  standupCount = computed(() => this.standupService.standups.length);

  navSections = computed((): NavSection[] => {
    const user = this.currentUser();
    const role = user?.role || 'admin';

    const isPMOrLead = ['admin', 'project_manager', 'team_lead'].includes(role);

    return [
      {
        title: 'Overview',
        items: [
          {
            label: 'PM Portal Dashboard',
            icon: 'dashboard',
            route: '/dashboard',
            exact: true,
          },
          {
            label: 'My Workspace',
            icon: 'badge',
            route: '/dashboard/my-workspace',
          },
        ],
      },
      {
        title: 'Project & Tasks',
        items: [
          {
            label: 'Kanban Tasks',
            icon: 'task_alt',
            route: '/tasks',
            badgeSignal: () => this.totalTaskCount(),
            badgeClass: 'badge-primary',
          },
          {
            label: 'Daily Follow-up',
            icon: 'event_note',
            route: '/daily-followup',
            badgeSignal: () => this.standupCount(),
            badgeClass: 'badge-warning',
          },
        ],
      },
      {
        title: 'Team Management',
        items: [
          {
            label: 'Team & Capacity',
            icon: 'groups',
            route: '/team-capacity',
          },
          {
            label: 'Help & Escalations',
            icon: 'support_agent',
            route: '/help',
            badgeSignal: () => (this.blockedTaskCount() > 0 ? this.blockedTaskCount() : null),
            badgeClass: 'badge-danger',
          },
        ],
      },
      {
        title: 'Analytics & Admin',
        items: [
          {
            label: 'Reports & Analytics',
            icon: 'analytics',
            route: '/reports',
          },
          {
            label: 'Admin Panel',
            icon: 'admin_panel_settings',
            route: '/admin',
          },
        ],
      },
    ];
  });

  formatRole(role: string): string {
    const roles: Record<string, string> = {
      admin: 'Project Manager (PM)',
      project_manager: 'Project Manager',
      team_lead: 'Team Lead',
      employee: 'Developer',
    };
    return roles[role] || role;
  }
}
