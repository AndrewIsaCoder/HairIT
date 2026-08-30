import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Icon, IconName } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { LiquidReveal } from '../../shared/liquid-reveal/liquid-reveal';
import { SalonCard } from '../../shared/salon-card/salon-card';
import { SalonStore } from '../../core/services/salon-store';
import { AuthStore } from '../../core/services/auth-store';
import { SalonCard as SalonCardModel } from '../../core/models';

interface Step {
  icon: IconName;
  title: string;
  text: string;
}

/** Pagina principală a platformei: căutare, categorii și saloane recomandate. */
@Component({
  selector: 'hairit-home-page',
  imports: [NgFor, NgIf, RouterLink, Icon, Reveal, LiquidReveal, SalonCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage implements OnInit {
  protected readonly store = inject(SalonStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly term = signal('');
  protected readonly city = signal('');

  protected readonly headline = ['Găsește-ți', 'salonul potrivit', 'și rezervă acum'];
  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly steps: Step[] = [
    { icon: 'search', title: 'Caută', text: 'Filtrează după oraș, tip de salon sau serviciu și compară prețurile.' },
    { icon: 'calendar', title: 'Alege ora', text: 'Vezi intervalele libere în timp real și alege specialistul dorit.' },
    { icon: 'check', title: 'Rezervă', text: 'Confirmi în câteva secunde și primești notificare în cont.' }
  ];

  /** primele saloane, ordonate deja după rating de către API */
  protected readonly featured = computed(() => this.store.salons().slice(0, 6));
  protected readonly cities = computed(() => this.store.filters()?.cities ?? []);
  protected readonly categories = computed(() => this.store.filters()?.categories ?? []);
  protected readonly stats = computed(() => this.store.filters()?.stats ?? null);

  ngOnInit(): void {
    this.store.loadFilters();
    this.store.search({});
  }

  protected search(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/saloane'], {
      queryParams: {
        q: this.term().trim() || undefined,
        city: this.city() || undefined
      }
    });
  }

  protected onTerm(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }

  protected onCity(event: Event): void {
    this.city.set((event.target as HTMLSelectElement).value);
  }

  protected toggleFavorite(salon: SalonCardModel): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/autentificare'], { queryParams: { redirect: '/' } });
      return;
    }
    this.store.toggleFavorite(salon).subscribe();
  }

  protected categoryIcon(category: string): IconName {
    if (category.includes('Barber')) return 'scissors';
    if (category.includes('unghii')) return 'sparkles';
    if (category.includes('înfrumusețare')) return 'spark';
    return 'user';
  }
}
