import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { register } from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-content animate-fade-in">
          <div class="brand-logo">
            <span class="material-icons-round">task_alt</span>
          </div>
          <h1>Get Started</h1>
          <p>Create your workspace and start managing your team with clarity and focus.</p>
        </div>
      </div>

      <div class="auth-form-area">
        <div class="auth-card animate-fade-in">
          <div class="auth-header">
            <h2>Create account</h2>
            <p>Join your team on FollowUp</p>
          </div>

          @if (authError()) {
            <div class="error-banner">
              <span class="material-icons-round">error_outline</span>
              {{ authError() }}
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form-fields">
            <div class="field-group">
              <label class="field-label">Full Name</label>
              <div class="field-input-wrap">
                <span class="material-icons-round field-icon">person</span>
                <input type="text" class="input field-input" formControlName="displayName" placeholder="John Doe" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Email Address</label>
              <div class="field-input-wrap">
                <span class="material-icons-round field-icon">email</span>
                <input type="email" class="input field-input" formControlName="email" placeholder="you@company.com" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="field-input-wrap">
                <span class="material-icons-round field-icon">lock</span>
                <input [type]="showPassword() ? 'text' : 'password'" class="input field-input" formControlName="password" placeholder="Min. 8 characters" />
                <button type="button" class="field-toggle" (click)="showPassword.set(!showPassword())">
                  <span class="material-icons-round">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                <span class="field-error">Password must be at least 8 characters</span>
              }
            </div>

            <button type="submit" class="btn btn--primary w-full" [disabled]="registerForm.invalid || (authLoading() ?? false)">
              @if (authLoading()) {
                <span class="spinner"></span> Creating account...
              } @else {
                <span class="material-icons-round">person_add</span> Create Account
              }
            </button>
          </form>

          <p class="auth-footer">
            Already have an account?
            <a routerLink="/auth/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Reuse auth-page styles from login */
    .auth-page { display: flex; min-height: 100vh; background: var(--surface-bg); }
    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%);
      display: flex; align-items: center; justify-content: center; padding: 3rem;
      @media (max-width: 768px) { display: none; }
    }
    .brand-logo {
      width: 64px; height: 64px; border-radius: 18px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;
      box-shadow: 0 8px 32px rgba(99,102,241,0.4);
      .material-icons-round { font-size: 2rem; color: #fff; }
    }
    .brand-content h1 {
      font-size: 2.5rem; font-weight: 800;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.75rem;
    }
    .brand-content p { color: var(--text-secondary); font-size: 1rem; line-height: 1.6; }
    .auth-form-area { width: 480px; display: flex; align-items: center; justify-content: center; padding: 2rem; @media (max-width: 768px) { width: 100%; } }
    .auth-card { width: 100%; max-width: 400px; }
    .auth-header { margin-bottom: 2rem; h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.35rem; } p { color: var(--text-secondary); } }
    .error-banner { display: flex; align-items: center; gap: 0.5rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--border-radius-sm); padding: 0.75rem 1rem; color: var(--color-danger); font-size: 0.875rem; margin-bottom: 1.25rem; }
    .auth-form-fields { display: flex; flex-direction: column; gap: 1.25rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .field-input-wrap { position: relative; display: flex; align-items: center; }
    .field-icon { position: absolute; left: 0.75rem; font-size: 1.1rem; color: var(--text-muted); pointer-events: none; }
    .field-input { padding-left: 2.6rem !important; padding-right: 2.6rem !important; }
    .field-toggle { position: absolute; right: 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; padding: 0; .material-icons-round { font-size: 1.1rem; } }
    .field-error { font-size: 0.75rem; color: var(--color-danger); }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-secondary); a { color: var(--color-primary-light); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } } }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  `],
})
export class RegisterComponent {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  authLoading = this.store.selectSignal(selectAuthLoading);
  authError = this.store.selectSignal(selectAuthError);
  showPassword = signal(false);

  registerForm = this.fb.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    const { email, password, displayName } = this.registerForm.value;
    this.store.dispatch(register({ email: email!, password: password!, displayName: displayName! }));
  }
}
