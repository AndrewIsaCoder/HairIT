import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Api } from './api';
import {
  ApiError,
  Appointment,
  DaySummary,
  PlatformFilters,
  Review,
  SalonCard,
  SalonDetail
} from '../models';

export interface SalonQuery {
  q?: string;
  city?: string;
  category?: string;
}

/** Catalogul de saloane: cautare, filtre si detaliile unui salon. */
@Injectable({ providedIn: 'root' })
export class SalonStore {
  private readonly api = inject(Api);

  readonly salons = signal<SalonCard[]>([]);
  readonly filters = signal<PlatformFilters | null>(null);
  readonly query = signal<SalonQuery>({});
  readonly loading = signal(false);
  readonly error = signal('');

  readonly resultCount = computed(() => this.salons().length);

  loadFilters(): void {
    if (this.filters()) return;
    this.api.get<PlatformFilters>('/salons/filters').subscribe({
      next: (value) => this.filters.set(value),
      error: (err: HttpErrorResponse) => this.fail(err)
    });
  }

  search(query: SalonQuery = {}): void {
    this.query.set(query);
    this.loading.set(true);
    this.error.set('');

    this.api.get<SalonCard[]>('/salons', { ...query }).subscribe({
      next: (list) => {
        this.salons.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.fail(err);
      }
    });
  }

  getSalon(slug: string): Observable<SalonDetail> {
    return this.api.get<SalonDetail>(`/salons/${slug}`);
  }

  getDays(slug: string, options: { serviceId?: number; staffId?: number } = {}): Observable<DaySummary[]> {
    return this.api.get<DaySummary[]>(`/salons/${slug}/days`, { ...options });
  }

  getSlots(
    slug: string,
    options: { date?: string; serviceId?: number; staffId?: number; status?: string } = {}
  ): Observable<Appointment[]> {
    return this.api.get<Appointment[]>(`/salons/${slug}/slots`, { ...options });
  }

  getReviews(slug: string): Observable<Review[]> {
    return this.api.get<Review[]>(`/salons/${slug}/reviews`);
  }

  /** Adauga sau scoate un salon de la favorite si actualizeaza lista curenta. */
  toggleFavorite(salon: { id: number; isFavorite: boolean }): Observable<unknown> {
    const request = salon.isFavorite
      ? this.api.delete(`/me/favorites/${salon.id}`)
      : this.api.post(`/me/favorites/${salon.id}`);

    return request.pipe(
      tap(() =>
        this.salons.update((list) =>
          list.map((item) => (item.id === salon.id ? { ...item, isFavorite: !salon.isFavorite } : item))
        )
      )
    );
  }

  private fail(err: HttpErrorResponse): void {
    const body = err.error as ApiError | undefined;
    this.error.set(body?.message ?? 'Nu am putut încărca datele. Verifică dacă API-ul rulează.');
  }
}
