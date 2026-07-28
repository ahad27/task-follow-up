import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private firestore = inject(Firestore, { optional: true });
  private readonly TASKS_KEY = 'followup_db_tasks';

  private initialDemoTasks: Task[] = [
    {
      id: 'tsk-101',
      title: 'Design Dark Theme Token System & UI Components',
      description: 'Finalize global SCSS tokens, responsive grid system, and Angular Material dark theme styles.',
      status: 'completed',
      priority: 'high',
      category: 'Design',
      assigneeIds: ['usr-3'],
      createdBy: 'usr-1',
      teamId: 'team-main',
      dueDate: new Date(Date.now() - 86400000),
      estimatedHours: 12,
      actualHours: 10,
      progressPercent: 100,
      isBlocked: false,
      blockerReason: '',
      attachments: [],
      tags: ['UI/UX', 'SCSS'],
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(),
      completedAt: new Date(),
    },
    {
      id: 'tsk-102',
      title: 'Implement Auth Guards & Role-Based Navigation',
      description: 'Set up AuthGuard and RoleGuard for routes: Dashboard, Team Capacity, Admin Panel, and Reports.',
      status: 'in_progress',
      priority: 'critical',
      category: 'Development',
      assigneeIds: ['usr-1'],
      createdBy: 'usr-pm-1',
      teamId: 'team-main',
      dueDate: new Date(Date.now() + 86400000 * 2),
      estimatedHours: 16,
      actualHours: 8,
      progressPercent: 65,
      isBlocked: false,
      blockerReason: '',
      attachments: [],
      tags: ['Auth', 'Angular', 'Guards'],
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(),
    },
    {
      id: 'tsk-103',
      title: 'Staging Environment Auth Token Expiration Fix',
      description: 'Fix auth token expiration issues during API calls in staging environment.',
      status: 'blocked',
      priority: 'critical',
      category: 'Infrastructure',
      assigneeIds: ['usr-5'],
      createdBy: 'usr-pm-1',
      teamId: 'team-main',
      dueDate: new Date(Date.now() + 86400000),
      estimatedHours: 8,
      actualHours: 4,
      progressPercent: 30,
      isBlocked: true,
      blockerReason: 'Waiting for DevOps deployment credentials on staging server.',
      attachments: [],
      tags: ['DevOps', 'Staging', 'Blocker'],
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'tsk-104',
      title: 'Automate CI/CD Regression Pipeline in GitHub Actions',
      description: 'Configure automated unit testing and end-to-end regression test triggers on main branch push.',
      status: 'in_progress',
      priority: 'high',
      category: 'QA & Testing',
      assigneeIds: ['usr-4'],
      createdBy: 'usr-pm-1',
      teamId: 'team-main',
      dueDate: new Date(Date.now() + 86400000 * 4),
      estimatedHours: 20,
      actualHours: 10,
      progressPercent: 50,
      isBlocked: false,
      blockerReason: '',
      attachments: [],
      tags: ['CI/CD', 'QA', 'Automation'],
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(),
    },
    {
      id: 'tsk-105',
      title: 'Drag-and-Drop Task Status State Handler',
      description: 'Implement drag-and-drop state management for Kanban board columns.',
      status: 'assigned',
      priority: 'medium',
      category: 'Development',
      assigneeIds: ['usr-2'],
      createdBy: 'usr-pm-1',
      teamId: 'team-main',
      dueDate: new Date(Date.now() + 86400000 * 5),
      estimatedHours: 14,
      actualHours: 0,
      progressPercent: 0,
      isBlocked: false,
      blockerReason: '',
      attachments: [],
      tags: ['Frontend', 'Kanban'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * Load all tasks from persistent Local Storage DB or Firestore
   */
  async loadTasks(): Promise<Task[]> {
    const saved = localStorage.getItem(this.TASKS_KEY);
    let localTasks: Task[] = [];
    if (saved) {
      try {
        localTasks = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored tasks DB', e);
      }
    }

    if (localTasks.length === 0) {
      localTasks = this.initialDemoTasks;
      this.saveTasksToStorage(localTasks);
    }

    // Try fetching from Firestore if online/configured
    if (this.firestore) {
      try {
        const snap = await getDocs(collection(this.firestore, 'tasks'));
        if (!snap.empty) {
          const remoteTasks = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              dueDate: data['dueDate']?.toDate?.() || new Date(data['dueDate']),
              createdAt: data['createdAt']?.toDate?.() || new Date(data['createdAt']),
              updatedAt: data['updatedAt']?.toDate?.() || new Date(data['updatedAt']),
            } as Task;
          });
          if (remoteTasks.length > 0) {
            this.saveTasksToStorage(remoteTasks);
            return remoteTasks;
          }
        }
      } catch (err) {
        // Firestore fallback to local persistent DB
      }
    }

    return localTasks;
  }

  /**
   * Save a new task to persistent Database (LocalStorage + Firestore)
   */
  async saveTask(task: Task): Promise<Task> {
    const tasks = await this.loadTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    let updatedTasks: Task[];

    if (existingIndex >= 0) {
      updatedTasks = [...tasks];
      updatedTasks[existingIndex] = { ...task, updatedAt: new Date() };
    } else {
      updatedTasks = [task, ...tasks];
    }

    this.saveTasksToStorage(updatedTasks);

    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'tasks', task.id);
        await setDoc(docRef, {
          ...task,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        // Safe fallback
      }
    }

    return task;
  }

  /**
   * Update task status in persistent DB
   */
  async updateTaskStatus(id: string, status: Task['status']): Promise<void> {
    const tasks = await this.loadTasks();
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const isCompleted = status === 'completed';
        const isBlocked = status === 'blocked';
        return {
          ...t,
          status,
          progressPercent: isCompleted ? 100 : t.progressPercent,
          isBlocked: isBlocked ? true : t.isBlocked,
          completedAt: isCompleted ? new Date() : t.completedAt,
          updatedAt: new Date(),
        };
      }
      return t;
    });

    this.saveTasksToStorage(updated);

    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'tasks', id);
        const changes: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
        if (status === 'completed') changes['completedAt'] = serverTimestamp();
        await updateDoc(docRef, changes);
      } catch (err) {
        // Safe fallback
      }
    }
  }

  /**
   * Update task progress % in persistent DB
   */
  async updateTaskProgress(id: string, progressPercent: number): Promise<void> {
    const tasks = await this.loadTasks();
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const isCompleted = progressPercent === 100;
        return {
          ...t,
          progressPercent,
          status: isCompleted ? 'completed' : t.status,
          completedAt: isCompleted ? new Date() : t.completedAt,
          updatedAt: new Date(),
        };
      }
      return t;
    });

    this.saveTasksToStorage(updated);

    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'tasks', id);
        await updateDoc(docRef, {
          progressPercent,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }

  /**
   * Delete task from persistent DB
   */
  async deleteTask(id: string): Promise<void> {
    const tasks = await this.loadTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    this.saveTasksToStorage(filtered);

    if (this.firestore) {
      try {
        await deleteDoc(doc(this.firestore, 'tasks', id));
      } catch (err) {
        // Safe fallback
      }
    }
  }

  private saveTasksToStorage(tasks: Task[]): void {
    localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
  }
}
