import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { PageLoader } from './components/page-loader/page-loader';
import { SiteHeader } from './components/site-header/site-header';
import { NavMenu } from './components/nav-menu/nav-menu';
import { HeroSection } from './components/hero-section/hero-section';
import { BookingSection } from './components/booking-section/booking-section';
import { ServicesSection } from './components/services-section/services-section';
import { StudioSection } from './components/studio-section/studio-section';
import { TeamSection } from './components/team-section/team-section';
import { StatsSection } from './components/stats-section/stats-section';
import { SiteFooter } from './components/site-footer/site-footer';
import { RequestModal } from './components/request-modal/request-modal';
import { BookingStore } from './core/services/booking-store';
import { SmoothScroll } from './core/services/smooth-scroll';
import { UiState } from './core/services/ui-state';

/** Componenta radacina: orchestreaza ecranul de incarcare, meniul si sectiunile paginii. */
@Component({
  selector: 'app-root',
  imports: [
    NgIf,
    PageLoader,
    SiteHeader,
    NavMenu,
    HeroSection,
    ServicesSection,
    BookingSection,
    StudioSection,
    TeamSection,
    StatsSection,
    SiteFooter,
    RequestModal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly ui = inject(UiState);
  private readonly store = inject(BookingStore);
  private readonly scroll = inject(SmoothScroll);

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.scroll.start();
    this.scroll.lock();
    this.store.init();
  }

  protected onIntroFinished(): void {
    this.ui.markReady();
    this.scroll.unlock();
  }
}
