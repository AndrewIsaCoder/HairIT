import { Injectable, OnDestroy, signal } from '@angular/core';

const TIME_FORMAT = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false });
const DATE_FORMAT = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

/** Ceas local afisat in header si in meniul principal. */
@Injectable({ providedIn: 'root' })
export class Clock implements OnDestroy {
  readonly time = signal(TIME_FORMAT.format(new Date()));
  readonly date = signal(DATE_FORMAT.format(new Date()));

  private readonly timer = setInterval(() => this.tick(), 1000);

  private tick(): void {
    const now = new Date();
    this.time.set(TIME_FORMAT.format(now));
    this.date.set(DATE_FORMAT.format(now));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
