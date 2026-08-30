import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Icon } from '../icon/icon';

/** Stele de rating; devine interactiv cand `editable` este activat. */
@Component({
  selector: 'hairit-rating',
  imports: [NgFor, NgIf, NgClass, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating.html',
  styleUrl: './rating.css'
})
export class Rating {
  readonly value = input(0);
  readonly count = input<number | null>(null);
  readonly editable = input(false);
  readonly compact = input(false);

  readonly changed = output<number>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly rounded = computed(() => Math.round(this.value()));
  protected readonly label = computed(() => (this.value() ? this.value().toFixed(1) : 'Nou'));
}
