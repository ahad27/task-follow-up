import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Router, RouterLink } from '@angular/router';
import { login, loginWithGoogle, setUser } from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';
import { UserProfile, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-content animate-fade-in">
          <div class="brand-logo">
            <span class="material-icons-round">task_alt</span>
          </div>
          <h1>FollowUp</h1>
          <p>Enterprise project management & daily task follow-up platform</p>

          <div class="brand-features">
            @for (feat of features; track feat.icon) {
              <div class="feature-item">
                <span class="material-icons-round">{{ feat.icon }}</span>
                <span>{{ feat.text }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="auth-form-area">
        <div class="auth-card animate-fade-in">
          <div class="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your project portal</p>
          </div>

          <!-- Quick Demo Access Banner for PM & Team -->
          <div class="demo-login-box">
            <span class="demo-title">⚡ Fast Demo Sign-In:</span>
            <div class="demo-buttons">
              <button class="btn btn--primary w-full demo-pm-btn" (click)="onDemoLogin('admin')">
                <span class="material-icons-round">admin_panel_settings</span>
                Login as Project Manager
              </button>
              <button class="btn btn--secondary w-full demo-emp-btn" (click)="onDemoLogin('employee')">
                <span class="material-icons-round">person</span>
                Login as Team Member
              </button>
            </div>
          </div>

          <div class="auth-divider"><span>or sign in with email</span></div>

          <!-- Error -->
          @if (authError()) {
            <div class="error-banner">
              <span class="material-icons-round">error_outline</span>
              {{ authError() }}
            </div>
          }

          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form-fields">
            <div class="field-group">
              <label class="field-label">Email Address</label>
              <div class="field-input-wrap">
                <span class="material-icons-round field-icon">email</span>
                <input
                  type="email"
                  class="input field-input"
                  formControlName="email"
                  placeholder="pm@company.com"
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="field-input-wrap">
                <span class="material-icons-round field-icon">lock</span>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  class="input field-input"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button type="button" class="field-toggle" (click)="showPassword.set(!showPassword())">
                  <span class="material-icons-round">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="btn btn--primary w-full"
              [disabled]="loginForm.invalid || (authLoading() ?? false)"
            >
              @if (authLoading()) {
                <span class="spinner"></span> Signing in...
              } @else {
                <span class="material-icons-round">login</span> Sign In
              }
            </button>
          </form>

          <p class="auth-footer">
            Don't have an account?
            <a routerLink="/auth/register">Create account</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      min-height: 100vh;
      background: var(--surface-bg);
    }

    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;

      @media (max-width: 768px) { display: none; }
    }

    .brand-content {
      position: relative;
      z-index: 1;
      max-width: 400px;
    }

    .brand-logo {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 32px rgba(99,102,241,0.4);

      .material-icons-round { font-size: 2rem; color: #fff; }
    }

    .brand-content h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.75rem;
    }

    .brand-content p {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .brand-features { display: flex; flex-direction: column; gap: 1rem; }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      .material-icons-round {
        font-size: 1.1rem;
        color: var(--color-primary-light);
        background: rgba(99,102,241,0.1);
        padding: 0.4rem;
        border-radius: 8px;
      }
    }

    .auth-form-area {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;

      @media (max-width: 768px) { width: 100%; }
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
    }

    .auth-header {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.35rem; }
      p { color: var(--text-secondary); }
    }

    /* Demo Login Box */
    .demo-login-box {
      padding: 1.2rem;
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: var(--border-radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .demo-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-primary-light);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .demo-buttons { display: flex; flex-direction: column; gap: 0.5rem; }

    .demo-pm-btn { justify-content: center; gap: 0.5rem; background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .demo-emp-btn { justify-content: center; gap: 0.5rem; }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--border-radius-sm);
      padding: 0.75rem 1rem;
      color: var(--color-danger);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .auth-form-fields { display: flex; flex-direction: column; gap: 1.25rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
    .field-input-wrap { position: relative; display: flex; align-items: center; }
    .field-icon { position: absolute; left: 0.75rem; font-size: 1.1rem; color: var(--text-muted); pointer-events: none; }
    .field-input { padding-left: 2.6rem !important; padding-right: 2.6rem !important; }
    .field-toggle { position: absolute; right: 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; padding: 0; }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1.25rem 0;
      color: var(--text-muted);
      font-size: 0.8rem;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--surface-border);
      }
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);

      a {
        color: var(--color-primary-light);
        font-weight: 600;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }
  `],
})
export class LoginComponent {
  private store = inject(Store);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  authLoading = this.store.selectSignal(selectAuthLoading);
  authError = this.store.selectSignal(selectAuthError);
  showPassword = signal(false);

  features = [
    { icon: 'admin_panel_settings', text: 'Project Manager Portal' },
    { icon: 'person_add', text: 'Add & Manage Team Members' },
    { icon: 'task_alt', text: 'Assign & Track Daily Tasks' },
    { icon: 'event_note', text: 'Daily Follow-up & Blocker Clearance' },
  ];

  loginForm = this.fb.group({
    email: ['pm@company.com', [Validators.required, Validators.email]],
    password: ['password123', Validators.required],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.onDemoLogin('admin');
  }

  onDemoLogin(role: UserRole): void {
    const user: UserProfile = {
      id: role === 'admin' ? 'usr-pm-1' : 'usr-emp-1',
      email: role === 'admin' ? 'pm@company.com' : 'dev@company.com',
      displayName: role === 'admin' ? 'Project Manager (Alex)' : 'Sarah Jenkins (Dev)',
      photoURL: null,
      role: role,
      teamId: 'team-main',
      departmentId: 'Engineering',
      isActive: true,
      capacity: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.store.dispatch(setUser({ user }));
    this.router.navigate([role === 'admin' ? '/dashboard' : '/dashboard/my-workspace']);
  }
}
