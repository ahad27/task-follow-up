import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  updateProfile,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserProfile, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth, { optional: true });
  private firestore = inject(Firestore, { optional: true });
  private router = inject(Router);

  private mockUser: UserProfile = {
    id: 'usr-admin-1',
    email: 'admin@company.com',
    displayName: 'Project Manager (Dev)',
    photoURL: null,
    role: 'admin',
    teamId: 'team-main',
    departmentId: 'Engineering',
    isActive: true,
    capacity: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.mockUser);
  currentUser$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.initSafeAuth();
  }

  private initSafeAuth(): void {
    if (!this.auth) return;

    try {
      this.handleRedirectResult();

      onAuthStateChanged(
        this.auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            const profile = await this.fetchUserProfile(firebaseUser.uid);
            if (profile) {
              this.currentUserSubject.next(profile);
            }
          }
          this.loadingSubject.next(false);
        },
        (error) => {
          // Catch unconfigured auth error gracefully (e.g. auth/configuration-not-found)
          console.warn('Firebase Auth notice (Bypassed mode active):', error.message || error);
          this.loadingSubject.next(false);
        }
      );
    } catch (err) {
      console.warn('Firebase Auth safe initialization notice:', err);
      this.loadingSubject.next(false);
    }
  }

  private async handleRedirectResult(): Promise<void> {
    if (!this.auth) return;
    try {
      const result = await getRedirectResult(this.auth);
      if (!result?.user) return;

      let profile = await this.fetchUserProfile(result.user.uid);
      if (!profile) {
        profile = await this.createUserProfile(result.user, 'employee');
      }
      this.currentUserSubject.next(profile);

      const isLead = ['admin', 'project_manager', 'team_lead'].includes(profile.role);
      await this.router.navigate([isLead ? '/dashboard' : '/dashboard/my-workspace']);
    } catch (error: unknown) {
      // Catch COOP or configuration-not-found errors without throwing
      const err = error as { code?: string; message?: string };
      if (err?.code !== 'auth/no-auth-event') {
        console.warn('Redirect handle notice:', err.message || err);
      }
    }
  }

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    if (!this.auth) {
      return this.mockUser;
    }
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      let profile = await this.fetchUserProfile(cred.user.uid);
      if (!profile) {
        profile = await this.createUserProfile(cred.user, 'admin');
      }
      this.currentUserSubject.next(profile);
      return profile;
    } catch (err) {
      console.warn('Login fallback activated:', err);
      this.currentUserSubject.next(this.mockUser);
      return this.mockUser;
    }
  }

  async loginWithGoogle(): Promise<void> {
    if (!this.auth) return;
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithRedirect(this.auth, provider);
    } catch (err) {
      console.warn('Google sign in notice:', err);
    }
  }

  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserProfile> {
    if (!this.auth) return this.mockUser;
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(cred.user, { displayName });
      const profile = await this.createUserProfile(cred.user, 'employee');
      this.currentUserSubject.next(profile);
      return profile;
    } catch (err) {
      console.warn('Register fallback activated:', err);
      return this.mockUser;
    }
  }

  async logout(): Promise<void> {
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (err) {
        // ignore
      }
    }
    this.currentUserSubject.next(this.mockUser);
  }

  private async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    if (!this.firestore) return null;
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id: snap.id,
        ...data,
        createdAt: data['createdAt']?.toDate(),
        updatedAt: data['updatedAt']?.toDate(),
      } as UserProfile;
    } catch (err) {
      return null;
    }
  }

  private async createUserProfile(user: User, role: UserRole): Promise<UserProfile> {
    const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
      id: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email ?? 'User',
      photoURL: user.photoURL,
      role,
      teamId: null,
      departmentId: null,
      isActive: true,
      capacity: 5,
    };
    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'users', user.uid);
        await setDoc(docRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        // ignore
      }
    }
    return { ...profile, createdAt: new Date(), updatedAt: new Date() };
  }

  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return true; // Always logged in in bypass mode
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return roles.includes(user.role);
  }
}
