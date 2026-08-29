import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppointmentApi } from './appointment-api';
import {
  ApiError,
  Appointment,
  DaySummary,
  ReservationRequest,
  SalonService,
  SalonStats,
  Stylist
} from '../models/appointment';

export type TermFilter = 'all' | 'available' | 'booked';

/**
 * Starea aplicatiei de programari, tinuta in signals.
 * Componentele citesc doar semnale derivate si apeleaza metodele de mai jos.
 */
@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly api = inject(AppointmentApi);

  /** lista completa de programari pentru ziua selectata */
  readonly terms = signal<Appointment[]>([]);
  readonly days = signal<DaySummary[]>([]);
  readonly services = signal<SalonService[]>([]);
  readonly stylists = signal<Stylist[]>([]);
  readonly stats = signal<SalonStats | null>(null);

  /** programarea selectata; initial nu este selectata niciuna */
  readonly selectedTerm = signal<Appointment | null>(null);
  readonly selectedDate = signal<string>('');
  readonly filter = signal<TermFilter>('all');

  readonly loading = signal(false);
  readonly reserving = signal(false);
  readonly notice = signal<string>('');
  readonly error = signal<string>('');
  readonly fieldErrors = signal<Record<string, string>>({});

  /** programarile afisate dupa aplicarea filtrului de status */
  readonly visibleTerms = computed(() => {
    const active = this.filter();
    const list = this.terms();
    return active === 'all' ? list : list.filter((term) => term.status === active);
  });

  readonly availableCount = computed(() => this.terms().filter((t) => t.status === 'available').length);
  readonly bookedCount = computed(() => this.terms().filter((t) => t.status === 'booked').length);

  readonly selectedDaySummary = computed(() => {
    const date = this.selectedDate();
    return this.days().find((day) => day.date === date) ?? null;
  });

  /** Incarca datele statice si prima zi disponibila. */
  init(): void {
    this.api.getServices().subscribe({ next: (list) => this.services.set(list) });
    this.api.getStylists().subscribe({ next: (list) => this.stylists.set(list) });
    this.refreshStats();

    this.api.getDays().subscribe({
      next: (days) => {
        this.days.set(days);
        const first = days[0]?.date ?? '';
        if (first) this.selectDate(first);
      },
      error: (err: HttpErrorResponse) => this.handleError(err)
    });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedTerm.set(null);
    this.notice.set('');
    this.loadTerms();
  }

  setFilter(filter: TermFilter): void {
    this.filter.set(filter);
  }

  /**
   * Selecteaza o programare. Daca este libera se poate rezerva,
   * daca este ocupata afisam un mesaj ca nu este disponibila.
   */
  selectTerm(term: Appointment): void {
    this.selectedTerm.set(term);
    this.error.set('');
    this.fieldErrors.set({});
    this.notice.set(
      term.status === 'booked'
        ? 'Intervalul ' + term.time + ' este deja rezervat. Alege alt interval liber.'
        : ''
    );
  }

  clearSelection(): void {
    this.selectedTerm.set(null);
    this.notice.set('');
  }

  /** Rezerva programarea selectata si trece statusul din "available" in "booked". */
  reserve(payload: ReservationRequest): void {
    const term = this.selectedTerm();
    if (!term || term.status === 'booked') return;

    this.reserving.set(true);
    this.error.set('');
    this.fieldErrors.set({});

    this.api.reserve(term.id, payload).subscribe({
      next: (updated) => {
        this.replaceTerm(updated);
        this.selectedTerm.set(updated);
        this.notice.set('Programare confirmată pentru ' + updated.clientName + ', la ora ' + updated.time + '.');
        this.reserving.set(false);
        this.refreshDays();
        this.refreshStats();
      },
      error: (err: HttpErrorResponse) => {
        this.reserving.set(false);
        this.handleError(err);
      }
    });
  }

  /** Anuleaza o rezervare si elibereaza intervalul. */
  cancel(term: Appointment): void {
    this.api.cancel(term.id).subscribe({
      next: (updated) => {
        this.replaceTerm(updated);
        if (this.selectedTerm()?.id === updated.id) this.selectedTerm.set(updated);
        this.notice.set('Rezervarea de la ora ' + updated.time + ' a fost anulată.');
        this.refreshDays();
        this.refreshStats();
      },
      error: (err: HttpErrorResponse) => this.handleError(err)
    });
  }

  private loadTerms(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getAppointments({ date: this.selectedDate() }).subscribe({
      next: (list) => {
        this.terms.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleError(err);
      }
    });
  }

  private replaceTerm(updated: Appointment): void {
    this.terms.update((list) => list.map((term) => (term.id === updated.id ? updated : term)));
  }

  private refreshDays(): void {
    this.api.getDays().subscribe({ next: (days) => this.days.set(days) });
  }

  private refreshStats(): void {
    this.api.getStats().subscribe({ next: (value) => this.stats.set(value) });
  }

  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiError | undefined;
    this.fieldErrors.set(body?.errors ?? {});
    this.error.set(
      body?.message ?? 'Nu am putut contacta serverul. Verifică dacă API-ul rulează pe portul 3100.'
    );
  }
}
