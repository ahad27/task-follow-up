import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile, UserRole } from '../models/user.model';
import { Firestore, collection, doc, setDoc, deleteDoc } from '@angular/fire/firestore';

export interface AddTeamMemberDto {
  displayName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  capacity: number;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private firestore = inject(Firestore, { optional: true });
  private readonly STORAGE_KEY = 'followup_team_members';

  private initialMembers: UserProfile[] = [
    {
      id: 'usr-1',
      displayName: 'Sarah Jenkins',
      email: 'sarah.j@company.com',
      photoURL: null,
      role: 'team_lead',
      teamId: 'team-frontend',
      departmentId: 'Engineering',
      isActive: true,
      capacity: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-2',
      displayName: 'John Miller',
      email: 'john.m@company.com',
      photoURL: null,
      role: 'employee',
      teamId: 'team-frontend',
      departmentId: 'Engineering',
      isActive: true,
      capacity: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-3',
      displayName: 'Maria Lopez',
      email: 'maria.l@company.com',
      photoURL: null,
      role: 'employee',
      teamId: 'team-design',
      departmentId: 'Product & Design',
      isActive: true,
      capacity: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-4',
      displayName: 'Ahmed Hassan',
      email: 'ahmed.h@company.com',
      photoURL: null,
      role: 'employee',
      teamId: 'team-qa',
      departmentId: 'Quality Assurance',
      isActive: true,
      capacity: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-5',
      displayName: 'David Patel',
      email: 'david.p@company.com',
      photoURL: null,
      role: 'employee',
      teamId: 'team-devops',
      departmentId: 'Infrastructure',
      isActive: true,
      capacity: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private membersSubject = new BehaviorSubject<UserProfile[]>(this.loadMembers());
  members$: Observable<UserProfile[]> = this.membersSubject.asObservable();

  private loadMembers(): UserProfile[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved team members', e);
      }
    }
    return this.initialMembers;
  }

  private saveMembers(members: UserProfile[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(members));
    this.membersSubject.next(members);
  }

  get members(): UserProfile[] {
    return this.membersSubject.value;
  }

  addMember(dto: AddTeamMemberDto): UserProfile {
    const newMember: UserProfile = {
      id: 'usr-' + Date.now(),
      displayName: dto.displayName,
      email: dto.email,
      photoURL: null,
      role: dto.role,
      teamId: 'team-main',
      departmentId: dto.departmentId || 'Engineering',
      isActive: true,
      capacity: dto.capacity || 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [newMember, ...this.membersSubject.value];
    this.saveMembers(updated);

    if (this.firestore) {
      try {
        setDoc(doc(this.firestore, 'users', newMember.id), newMember);
      } catch (e) {
        // ignore
      }
    }

    return newMember;
  }

  removeMember(id: string): void {
    const updated = this.membersSubject.value.filter((m) => m.id !== id);
    this.saveMembers(updated);

    if (this.firestore) {
      try {
        deleteDoc(doc(this.firestore, 'users', id));
      } catch (e) {
        // ignore
      }
    }
  }
}
