import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { TermCard } from '../term-card/term-card';
import { TermDetails } from '../term-details/term-details';
import { Icon } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { BookingStore, TermFilter } from '../../core/services/booking-store';
import { dayNumber, longDate, monthShort, weekdayShort } from '../../core/utils/format';

interface FilterOption {
  value: TermFilter;
  label: string;
}

/** Sectiunea principala: calendar, filtre, lista de intervale si detalii. */
@Component({
  selector: 'hairit-booking-section',
  imports: [NgFor, NgIf, NgClass, TermCard, TermDetails, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-section.html',
  styleUrl: './booking-section.css'
})
export class BookingSection {
  protected readonly store = inject(BookingStore);

  protected readonly filters: FilterOption[] = [
    { value: 'all', label: 'Toate' },
    { value: 'available', label: 'Libere' },
    { value: 'booked', label: 'Ocupate' }
  ];

  protected readonly weekday = weekdayShort;
  protected readonly dayNumber = dayNumber;
  protected readonly monthShort = monthShort;
  protected readonly longDate = longDate;

  protected count(filter: TermFilter): number {
    if (filter === 'available') return this.store.availableCount();
    if (filter === 'booked') return this.store.bookedCount();
    return this.store.terms().length;
  }

  protected isSelected(id: number): boolean {
    return this.store.selectedTerm()?.id === id;
  }
}
