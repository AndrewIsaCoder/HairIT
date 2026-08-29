import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { BookingStore } from '../../core/services/booking-store';
import { UiState } from '../../core/services/ui-state';

/** Detalii de prezentare pentru fiecare stilist, in ordinea din API. */
const PROFILE = [
  { years: '12 ani experiență', tags: ['Tuns', 'Styling', 'Coafuri de eveniment'] },
  { years: '9 ani experiență', tags: ['Balayage', 'Blond', 'Corecții de culoare'] },
  { years: '7 ani experiență', tags: ['Tratamente', 'Ten', 'Manichiură'] }
];

@Component({
  selector: 'hairit-team-section',
  imports: [NgFor, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-section.html',
  styleUrl: './team-section.css'
})
export class TeamSection {
  protected readonly store = inject(BookingStore);
  protected readonly ui = inject(UiState);

  protected profile(index: number) {
    return PROFILE[index % PROFILE.length];
  }
}
