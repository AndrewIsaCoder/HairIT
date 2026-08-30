import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Api } from './api';
import { ApiError, User } from '../models';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'client' | 'owner';
}

/** Utilizatorul autentificat si operatiile legate de cont. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(Api);

  readonly user = signal<User | null>(null);
  readonly checked = signal(false);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isOwner = computed(() => this.user()?.role === 'owner');
  readonly initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  /** Reciteste utilizatorul curent de pe server (de exemplu dupa schimbarea rolului). */
  refreshUser(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => {
        this.user.set(user);
        this.checked.set(true);
      })
    );
  }

  /** Verifica sesiunea existenta la pornirea aplicatiei. */
  restore(): void {
    this.refreshUser().subscribe({
      error: () => {
        this.user.set(null);
        this.checked.set(true);
      }
    });
  }

  login(credentials: Credentials): Observable<User> {
    this.begin();
    return this.api.post<User>('/auth/login', credentials).pipe(
      tap({
        next: (user) => {
          this.user.set(user);
          this.pending.set(false);
        },
        error: (err) => this.fail(err)
      })
    );
  }

  register(data: RegistrationData): Observable<User> {
    this.begin();
    return this.api.post<User>('/auth/register', data).pipe(
      tap({
        next: (user) => {
          this.user.set(user);
          this.pending.set(false);
        },
        error: (err) => this.fail(err)
      })
    );
  }

  logout(): Observable<unknown> {
    return this.api.post('/auth/logout').pipe(tap(() => this.user.set(null)));
  }

  updateProfile(data: { fullName: string; phone: string }): Observable<User> {
    this.begin();
    return this.api.patch<User>('/auth/me', data).pipe(
      tap({
        next: (user) => {
          this.user.set(user);
          this.pending.set(false);
        },
        error: (err) => this.fail(err)
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<unknown> {
    this.begin();
    return this.api.post('/auth/me/password', data).pipe(
      tap({
        next: () => {
          this.user.set(null);
          this.pending.set(false);
        },
        error: (err) => this.fail(err)
      })
    );
  }

  clearErrors(): void {
    this.error.set('');
    this.fieldErrors.set({});
  }

  private begin(): void {
    this.pending.set(true);
    this.clearErrors();
  }

  private fail(err: HttpErrorResponse): void {
    const body = err.error as ApiError | undefined;
    this.pending.set(false);
    this.fieldErrors.set(body?.errors ?? {});
    this.error.set(body?.message ?? 'Nu am putut contacta serverul. Încearcă din nou.');
  }
}
