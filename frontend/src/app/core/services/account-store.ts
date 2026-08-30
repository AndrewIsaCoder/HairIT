import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Api } from './api';
import { ApiError, AppNotification, Appointment, MyAppointments, ReservationRequest, SalonCard } from '../models';

/** Programarile, favoritele si notificarile utilizatorului autentificat. */
@Injectable({ providedIn: 'root' })
export class AccountStore {
  private readonly api = inject(Api);

  readonly appointments = signal<MyAppointments>({ upcoming: [], past: [] });
  readonly favorites = signal<SalonCard[]>([]);
  readonly notifications = signal<AppNotification[]>([]);
  readonly unread = signal(0);

  readonly loading = signal(false);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly message = signal('');

  readonly upcomingCount = computed(() => this.appointments().upcoming.length);

  /** Se apeleaza dupa autentificare si dupa fiecare schimbare de programare. */
  refresh(): void {
    this.loadAppointments();
    this.loadNotifications();
  }

  clear(): void {
    this.appointments.set({ upcoming: [], past: [] });
    this.favorites.set([]);
    this.notifications.set([]);
    this.unread.set(0);
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.api.get<MyAppointments>('/me/appointments').subscribe({
      next: (value) => {
        this.appointments.set(value);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.fail(err);
      }
    });
  }

  loadFavorites(): void {
    this.api.get<SalonCard[]>('/me/favorites').subscribe({
      next: (value) => this.favorites.set(value),
      error: (err: HttpErrorResponse) => this.fail(err)
    });
  }

  loadNotifications(): void {
    this.api.get<{ items: AppNotification[]; unread: number }>('/me/notifications').subscribe({
      next: (value) => {
        this.notifications.set(value.items);
        this.unread.set(value.unread);
      },
      error: () => {
        this.notifications.set([]);
        this.unread.set(0);
      }
    });
  }

  markAllRead(): void {
    this.api.post('/me/notifications/read-all').subscribe({
      next: () => {
        this.notifications.update((list) => list.map((item) => ({ ...item, isRead: 1 })));
        this.unread.set(0);
      }
    });
  }

  markRead(id: number): void {
    this.api.post<{ unread: number }>(`/me/notifications/${id}/read`).subscribe({
      next: (value) => {
        this.notifications.update((list) =>
          list.map((item) => (item.id === id ? { ...item, isRead: 1 } : item))
        );
        this.unread.set(value.unread);
      }
    });
  }

  /** Rezerva un interval liber. */
  reserve(id: number, payload: ReservationRequest): Observable<Appointment> {
    this.pending.set(true);
    this.error.set('');
    this.fieldErrors.set({});

    return this.api.post<Appointment>(`/appointments/${id}/reserve`, payload).pipe(
      tap({
        next: () => {
          this.pending.set(false);
          this.refresh();
        },
        error: (err) => this.fail(err, true)
      })
    );
  }

  cancel(id: number): Observable<Appointment> {
    return this.api.post<Appointment>(`/appointments/${id}/cancel`).pipe(
      tap({
        next: () => {
          this.message.set('Programarea a fost anulată.');
          this.refresh();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  reschedule(id: number, targetId: number): Observable<Appointment> {
    this.pending.set(true);
    return this.api.post<Appointment>(`/appointments/${id}/reschedule`, { targetId }).pipe(
      tap({
        next: () => {
          this.pending.set(false);
          this.message.set('Programarea a fost mutată.');
          this.refresh();
        },
        error: (err) => this.fail(err, true)
      })
    );
  }

  saveReview(slug: string, review: { rating: number; comment: string }): Observable<unknown> {
    this.pending.set(true);
    return this.api.put(`/me/reviews/${slug}`, review).pipe(
      tap({
        next: () => this.pending.set(false),
        error: (err) => this.fail(err, true)
      })
    );
  }

  private fail(err: HttpErrorResponse, clearPending = false): void {
    if (clearPending) this.pending.set(false);
    const body = err.error as ApiError | undefined;
    this.fieldErrors.set(body?.errors ?? {});
    this.error.set(body?.message ?? 'A apărut o eroare. Încearcă din nou.');
  }
}
