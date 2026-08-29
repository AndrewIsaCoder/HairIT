import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  DaySummary,
  ReservationRequest,
  SalonService,
  SalonStats,
  Stylist
} from '../models/appointment';

/** Singurul punct din aplicatie care vorbeste direct cu API-ul Express. */
@Injectable({ providedIn: 'root' })
export class AppointmentApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getAppointments(filters: { date?: string; status?: string; serviceId?: number } = {}): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters.date) params = params.set('date', filters.date);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.serviceId) params = params.set('serviceId', String(filters.serviceId));

    return this.http.get<Appointment[]>(this.base + '/appointments', { params });
  }

  getDays(): Observable<DaySummary[]> {
    return this.http.get<DaySummary[]>(this.base + '/appointments/days');
  }

  getServices(): Observable<SalonService[]> {
    return this.http.get<SalonService[]>(this.base + '/services');
  }

  getStylists(): Observable<Stylist[]> {
    return this.http.get<Stylist[]>(this.base + '/stylists');
  }

  getStats(): Observable<SalonStats> {
    return this.http.get<SalonStats>(this.base + '/stats');
  }

  reserve(id: number, payload: ReservationRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.base + '/appointments/' + id + '/reserve', payload);
  }

  cancel(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(this.base + '/appointments/' + id + '/cancel', {});
  }
}
