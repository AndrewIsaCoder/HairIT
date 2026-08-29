import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { BookingStore } from '../../core/services/booking-store';
import { UiState } from '../../core/services/ui-state';
import { money } from '../../core/utils/format';

/** Lista serviciilor salonului, incarcata din API. */
@Component({
  selector: 'hairit-services-section',
  imports: [NgFor, NgIf, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services-section.html',
  styleUrl: './services-section.css'
})
export class ServicesSection {
  protected readonly store = inject(BookingStore);
  protected readonly ui = inject(UiState);

  protected readonly price = money;

  protected index(position: number): string {
    return String(position + 1).padStart(2, '0');
  }
}
