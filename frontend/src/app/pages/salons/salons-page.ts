import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { SalonCard } from '../../shared/salon-card/salon-card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { SalonStore } from '../../core/services/salon-store';
import { AuthStore } from '../../core/services/auth-store';
import { SalonCard as SalonCardModel } from '../../core/models';

/** Rezultatele căutării, cu filtre după oraș și categorie. */
@Component({
  selector: 'hairit-salons-page',
  imports: [NgFor, NgIf, Icon, Reveal, SalonCard, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salons-page.html',
  styleUrl: './salons-page.css'
})
export class SalonsPage implements OnInit {
  protected readonly store = inject(SalonStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly term = signal('');
  protected readonly city = signal('');
  protected readonly category = signal('');

  protected readonly cities = computed(() => this.store.filters()?.cities ?? []);
  protected readonly categories = computed(() => this.store.filters()?.categories ?? []);
  protected readonly hasFilters = computed(() => Boolean(this.term() || this.city() || this.category()));

  ngOnInit(): void {
    this.store.loadFilters();

    this.route.queryParamMap.subscribe((params) => {
      this.term.set(params.get('q') ?? '');
      this.city.set(params.get('city') ?? '');
      this.category.set(params.get('category') ?? '');

      this.store.search({
        q: this.term() || undefined,
        city: this.city() || undefined,
        category: this.category() || undefined
      });
    });
  }

  protected apply(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.term().trim() || null,
        city: this.city() || null,
        category: this.category() || null
      },
      queryParamsHandling: 'merge'
    });
  }

  protected reset(): void {
    this.term.set('');
    this.city.set('');
    this.category.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected onTerm(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }

  protected onCity(event: Event): void {
    this.city.set((event.target as HTMLSelectElement).value);
    this.apply();
  }

  protected onCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
    this.apply();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.apply();
  }

  protected toggleFavorite(salon: SalonCardModel): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/autentificare'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.store.toggleFavorite(salon).subscribe();
  }
}
