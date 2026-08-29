import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { LiquidReveal } from '../../shared/liquid-reveal/liquid-reveal';
import { UiState } from '../../core/services/ui-state';
import { BookingStore } from '../../core/services/booking-store';

interface HighlightCard {
  caption: string;
  title: string;
}

/** Prima sectiune: imagine full-bleed cu dezvaluire sub cursor si titlul principal. */
@Component({
  selector: 'hairit-hero-section',
  imports: [NgFor, NgIf, Icon, LiquidReveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css'
})
export class HeroSection {
  protected readonly ui = inject(UiState);
  protected readonly store = inject(BookingStore);

  protected readonly headline = ['Stil impecabil,', 'programat în', '30 de secunde'];

  protected readonly partners = [
    'Kevin Murphy',
    'Olaplex',
    'Wella',
    'Davines',
    'Redken',
    'Moroccanoil',
    'Schwarzkopf'
  ];

  protected readonly cards: HighlightCard[] = [
    { caption: 'Culoare', title: 'Balayage lucrat manual.' },
    { caption: 'Îngrijire', title: 'Ritualuri cu keratină.' },
    { caption: 'Styling', title: 'Coafuri de eveniment.' }
  ];

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly activeCard = signal(0);
  protected readonly card = computed(() => this.cards[this.activeCard()]);

  protected readonly freeToday = computed(() => this.store.availableCount());

  protected move(step: number): void {
    const total = this.cards.length;
    this.activeCard.set((this.activeCard() + step + total) % total);
  }

  protected go(target: string): void {
    this.ui.goTo(target);
  }
}
