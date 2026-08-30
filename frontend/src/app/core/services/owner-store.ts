import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Api } from './api';
import { ApiError, Appointment, DaySummary, OwnerSalon, SalonCard, SalonService } from '../models';

export interface NewService {
  name: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
}

/** Datele panoului de administrare al unui salon. */
@Injectable({ providedIn: 'root' })
export class OwnerStore {
  private readonly api = inject(Api);

  readonly salons = signal<SalonCard[]>([]);
  readonly current = signal<OwnerSalon | null>(null);
  readonly slots = signal<Appointment[]>([]);
  readonly days = signal<DaySummary[]>([]);
  readonly date = signal('');

  readonly loading = signal(false);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly message = signal('');

  loadSalons(): Observable<SalonCard[]> {
    this.loading.set(true);
    return this.api.get<SalonCard[]>('/owner/salons').pipe(
      tap({
        next: (list) => {
          this.salons.set(list);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.fail(err);
        }
      })
    );
  }

  select(salonId: number): void {
    this.api.get<OwnerSalon>(`/owner/salons/${salonId}`).subscribe({
      next: (salon) => this.current.set(salon),
      error: (err: HttpErrorResponse) => this.fail(err)
    });
    this.loadAgenda(salonId, this.date());
  }

  loadAgenda(salonId: number, date?: string): void {
    this.api
      .get<{ date: string; slots: Appointment[]; days: DaySummary[] }>(`/owner/salons/${salonId}/agenda`, { date })
      .subscribe({
        next: (value) => {
          this.date.set(value.date);
          this.slots.set(value.slots);
          this.days.set(value.days);
        },
        error: (err: HttpErrorResponse) => this.fail(err)
      });
  }

  addService(salonId: number, service: NewService): Observable<SalonService> {
    this.pending.set(true);
    this.error.set('');
    this.fieldErrors.set({});

    return this.api.post<SalonService>(`/owner/salons/${salonId}/services`, service).pipe(
      tap({
        next: () => {
          this.pending.set(false);
          this.message.set('Serviciul a fost adăugat.');
          this.select(salonId);
        },
        error: (err) => {
          this.pending.set(false);
          this.fail(err);
        }
      })
    );
  }

  removeService(salonId: number, serviceId: number): Observable<unknown> {
    return this.api.delete(`/owner/services/${serviceId}`).pipe(
      tap({
        next: () => {
          this.message.set('Serviciul a fost șters.');
          this.select(salonId);
        },
        error: (err) => this.fail(err)
      })
    );
  }

  cancelBooking(salonId: number, appointmentId: number): Observable<Appointment> {
    return this.api.post<Appointment>(`/appointments/${appointmentId}/cancel`).pipe(
      tap({
        next: () => {
          this.message.set('Rezervarea a fost anulată, iar clientul a fost notificat.');
          this.loadAgenda(salonId, this.date());
          this.select(salonId);
        },
        error: (err) => this.fail(err)
      })
    );
  }

  private fail(err: HttpErrorResponse): void {
    const body = err.error as ApiError | undefined;
    this.fieldErrors.set(body?.errors ?? {});
    this.error.set(body?.message ?? 'A apărut o eroare. Încearcă din nou.');
  }
}
