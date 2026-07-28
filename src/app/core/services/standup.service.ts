import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Standup } from '../models/shared.model';

@Injectable({ providedIn: 'root' })
export class StandupService {
  private readonly STORAGE_KEY = 'followup_daily_standups';

  private initialStandups: Standup[] = [
    {
      id: 'st-1',
      userId: 'usr-1',
      teamId: 'team-frontend',
      date: new Date().toISOString().split('T')[0],
      completed: 'Completed code review for auth flow and updated documentation.',
      planned: 'Will lead the frontend architecture sync and start task assignment API.',
      blockers: '',
      helpNeeded: '',
      progressPercent: 85,
      submittedAt: new Date(),
      isEscalated: false,
    },
    {
      id: 'st-2',
      userId: 'usr-2',
      teamId: 'team-frontend',
      date: new Date().toISOString().split('T')[0],
      completed: 'Finished baseline UI components for Kanban board.',
      planned: 'Integrating drag-and-drop state management.',
      blockers: 'Waiting for database index configuration approval on Firestore.',
      helpNeeded: 'Need PM approval for new Firestore rule schema.',
      progressPercent: 60,
      submittedAt: new Date(),
      managerComment: 'Checking index config with DevOps team right now.',
      managerCommentBy: 'Project Manager',
      isEscalated: true,
    },
    {
      id: 'st-3',
      userId: 'usr-3',
      teamId: 'team-design',
      date: new Date().toISOString().split('T')[0],
      completed: 'Finalized Figma design system tokens for dark mode theme.',
      planned: 'Designing mobile responsive mockups for task detail drawer.',
      blockers: '',
      helpNeeded: '',
      progressPercent: 90,
      submittedAt: new Date(),
      isEscalated: false,
    },
    {
      id: 'st-4',
      userId: 'usr-4',
      teamId: 'team-qa',
      date: new Date().toISOString().split('T')[0],
      completed: 'Executed end-to-end user journey test suite.',
      planned: 'Setting up automated regression test pipelines in CI/CD.',
      blockers: 'Staging environment auth token expiring intermittently.',
      helpNeeded: 'DevOps assistance required for staging environment.',
      progressPercent: 50,
      submittedAt: new Date(),
      isEscalated: true,
    },
  ];

  private standupsSubject = new BehaviorSubject<Standup[]>(this.loadStandups());
  standups$: Observable<Standup[]> = this.standupsSubject.asObservable();

  private loadStandups(): Standup[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse standups', e);
      }
    }
    return this.initialStandups;
  }

  private saveStandups(items: Standup[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.standupsSubject.next(items);
  }

  get standups(): Standup[] {
    return this.standupsSubject.value;
  }

  addStandup(standup: Omit<Standup, 'id' | 'submittedAt'>): Standup {
    const newEntry: Standup = {
      ...standup,
      id: 'st-' + Date.now(),
      submittedAt: new Date(),
    };
    const updated = [newEntry, ...this.standupsSubject.value];
    this.saveStandups(updated);
    return newEntry;
  }

  addManagerComment(standupId: string, comment: string, managerName = 'Project Manager'): void {
    const updated = this.standupsSubject.value.map((s) => {
      if (s.id === standupId) {
        return {
          ...s,
          managerComment: comment,
          managerCommentBy: managerName,
        };
      }
      return s;
    });
    this.saveStandups(updated);
  }

  clearBlocker(standupId: string): void {
    const updated = this.standupsSubject.value.map((s) => {
      if (s.id === standupId) {
        return {
          ...s,
          blockers: '',
          isEscalated: false,
        };
      }
      return s;
    });
    this.saveStandups(updated);
  }
}
