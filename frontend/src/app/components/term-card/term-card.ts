import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { Appointment } from '../../core/models/appointment';
import { money } from '../../core/utils/format';

/** Un interval din lista de programari. Culoarea vine din statusul programarii. */
@Component({
  selector: 'hairit-term-card',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './term-card.html',
  styleUrl: './term-card.css'
})
export class TermCard {
  readonly term = input.required<Appointment>();
  readonly selected = input(false);

  /** programarea aleasa de utilizator */
  readonly choose = output<Appointment>();

  protected readonly isAvailable = computed(() => this.term().status === 'available');
  protected readonly price = computed(() => money(this.term().price));
}
