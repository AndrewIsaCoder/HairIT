import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { Rating } from '../rating/rating';
import { SalonCard as SalonCardModel } from '../../core/models';
import { money } from '../../core/utils/format';

/** Cardul unui salon din listări. */
@Component({
  selector: 'hairit-salon-card',
  imports: [NgIf, RouterLink, Icon, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salon-card.html',
  styleUrl: './salon-card.css'
})
export class SalonCard {
  readonly salon = input.required<SalonCardModel>();
  readonly showFavorite = input(true);

  readonly favoriteToggled = output<SalonCardModel>();

  protected readonly price = computed(() => money(this.salon().minPrice));
}
