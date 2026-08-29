import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { NgFor } from '@angular/common';
import { Reveal } from '../../shared/reveal/reveal';
import { BookingStore } from '../../core/services/booking-store';

interface StatCard {
  value: number;
  suffix: string;
  label: string;
}

/** Panou cu cifrele salonului; numerele cresc pe masura ce sectiunea intra in ecran. */
@Component({
  selector: 'hairit-stats-section',
  imports: [NgFor, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-section.html',
  styleUrl: './stats-section.css'
})
export class StatsSection implements AfterViewInit {
  private readonly store = inject(BookingStore);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  /** cat de mult a intrat panoul in ecran, intre 0 si 1 */
  private readonly progress = signal(0);
  private lastRun = 0;

  protected readonly cards = computed<StatCard[]>(() => {
    const stats = this.store.stats();
    return [
      { value: stats?.total ?? 0, suffix: '', label: 'Intervale în sistem' },
      { value: stats?.occupancy ?? 0, suffix: '%', label: 'Grad de ocupare' },
      { value: 12, suffix: '', label: 'Ani de experiență' },
      { value: stats?.services ?? 0, suffix: '', label: 'Servicii disponibile' }
    ];
  });

  /** valorile animate, calculate din progresul de scroll */
  protected readonly values = computed(() =>
    this.cards().map((card) => Math.round(card.value * this.progress()))
  );

  ngAfterViewInit(): void {
    this.measure();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  protected onScroll(): void {
    const now = Date.now();
    if (now - this.lastRun < 30) return;
    this.lastRun = now;
    this.measure();
  }

  private measure(): void {
    const rect = this.panel().nativeElement.getBoundingClientRect();
    const viewport = window.innerHeight;
    const span = viewport / 2 + rect.height / 2;
    const raw = (viewport - rect.top) / (span || 1);
    this.progress.set(Math.min(Math.max(raw, 0), 1));
  }
}
