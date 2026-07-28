import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { logout, setUser } from '../../store/auth/auth.actions';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <!-- Left: hamburger + greeting -->
      <div class="topbar__left">
        <button class="btn btn--icon show-mobile" (click)="toggleSidebar.emit()">
          <span class="material-icons-round">menu</span>
        </button>
        @if (currentUser(); as user) {
          <div class="greeting">
            <span class="greeting-text">Good {{ timeOfDay }}, <strong>{{ firstName(user.displayName) }}</strong></span>
            <span class="greeting-date">{{ today }}</span>
          </div>
        }
      </div>

      <!-- Center: Role Switcher / Quick Mode Indicator -->
      <div class="topbar__role-switcher">
        <span class="switcher-label">View Mode:</span>
        <div class="role-pill">
          <span class="material-icons-round role-icon">admin_panel_settings</span>
          <select
            class="role-select"
            [value]="currentUser()?.role || 'admin'"
            (change)="onRoleSwitch($event)"
          >
            <option value="admin">👑 Project Manager (PM)</option>
            <option value="team_lead">⚡ Team Lead</option>
            <option value="employee">👤 Developer / Employee</option>
          </select>
        </div>
      </div>

      <!-- Right: notifications + user -->
      <div class="topbar__right">
        <button class="btn btn--icon notification-btn" data-tooltip="Notifications">
          <span class="material-icons-round">notifications</span>
          <span class="notification-dot"></span>
        </button>

        @if (currentUser(); as user) {
          <div class="user-menu">
            <div class="avatar avatar--sm avatar--initials">
              {{ user.displayName.charAt(0).toUpperCase() }}
            </div>
            <div class="user-dropdown">
              <div class="dropdown-header">
                <strong>{{ user.displayName }}</strong>
                <span class="text-muted">{{ formatRoleLabel(user.role) }}</span>
              </div>
              <div class="divider"></div>
              <button class="dropdown-item" (click)="onSwitchToRole('admin')">
                <span class="material-icons-round">admin_panel_settings</span> PM Mode
              </button>
              <button class="dropdown-item" (click)="onSwitchToRole('employee')">
                <span class="material-icons-round">person</span> Employee Mode
              </button>
              <div class="divider"></div>
              <button class="dropdown-item dropdown-item--danger" (click)="onLogout()">
                <span class="material-icons-round">logout</span> Reset Session
              </button>
            </div>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: var(--topbar-height);
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 1.5rem;
      flex-shrink: 0;
    }

    .topbar__left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }

    .greeting {
      display: flex;
      flex-direction: column;
      line-height: 1.2;

      .greeting-text {
        font-size: 0.9rem;
        color: var(--text-secondary);
        strong { color: var(--text-primary); }
      }
      .greeting-date {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
    }

    .topbar__role-switcher {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .switcher-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .role-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: var(--border-radius-full);
      padding: 0.25rem 0.75rem;

      .role-icon { font-size: 1rem; color: var(--color-primary-light); }
    }

    .role-select {
      background: transparent;
      border: none;
      outline: none;
      color: var(--color-primary-light);
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;

      option {
        background: var(--surface-card);
        color: var(--text-primary);
      }
    }

    .topbar__right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
      flex-shrink: 0;
    }

    .notification-btn {
      position: relative;
    }

    .notification-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      background: var(--color-danger);
      border-radius: 50%;
      border: 2px solid var(--surface-card);
    }

    .user-menu {
      position: relative;
      cursor: pointer;

      &:hover .user-dropdown { opacity: 1; pointer-events: all; transform: translateY(0); }
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-md);
      padding: 0.5rem;
      min-width: 200px;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: var(--transition-fast);
      z-index: 1000;
    }

    .dropdown-header {
      padding: 0.4rem 0.75rem 0.6rem;
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;

      strong { color: var(--text-primary); }
      span { font-size: 0.72rem; }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: var(--transition-fast);
      text-align: left;

      &:hover {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &--danger:hover { color: var(--color-danger); }

      .material-icons-round { font-size: 1rem; }
    }

    @media (max-width: 768px) {
      .topbar__role-switcher, .greeting { display: none; }
    }
  `],
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private store = inject(Store);
  private authService = inject(AuthService);

  currentUser = this.store.selectSignal(selectCurrentUser);

  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }

  get today(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  firstName(displayName: string): string {
    return displayName.split(' ')[0];
  }

  formatRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Project Manager (PM)',
      project_manager: 'Project Manager',
      team_lead: 'Team Lead',
      employee: 'Developer',
    };
    return labels[role] || role;
  }

  onRoleSwitch(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.onSwitchToRole(role);
  }

  onSwitchToRole(role: UserRole): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, role };
      this.store.dispatch(setUser({ user: updatedUser }));
    }
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }
}
