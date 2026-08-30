import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

type Query = Record<string, string | number | undefined | null>;

/**
 * Invelis subtire peste HttpClient: prefixeaza `/api` si trimite cookie-ul
 * de sesiune la fiecare cerere.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  get<T>(path: string, query: Query = {}): Observable<T> {
    return this.http.get<T>(this.base + path, {
      params: this.toParams(query),
      withCredentials: true
    });
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<T>(this.base + path, body, { withCredentials: true });
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(this.base + path, body, { withCredentials: true });
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<T>(this.base + path, body, { withCredentials: true });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.base + path, { withCredentials: true });
  }

  private toParams(query: Query): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }
}
