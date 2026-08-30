import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PageLoader } from './layout/page-loader/page-loader';
import { SiteHeader } from './layout/site-header/site-header';
import { SiteFooter } from './layout/site-footer/site-footer';
import { NavMenu } from './layout/nav-menu/nav-menu';
import { SpeedInsights } from './shared/speed-insights/speed-insights';
import { AuthStore } from './core/services/auth-store';
import { AccountStore } from './core/services/account-store';
import { SmoothScroll } from './core/services/smooth-scroll';
import { UiState } from './core/services/ui-state';

/** Componenta rădăcină: ecranul de intrare, bara de navigare și paginile rutate. */
@Component({
  selector: 'app-root',
  imports: [NgIf, RouterOutlet, PageLoader, SiteHeader, SiteFooter, NavMenu, SpeedInsights],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly ui = inject(UiState);
  private readonly auth = inject(AuthStore);
  private readonly account = inject(AccountStore);
  private readonly scroll = inject(SmoothScroll);

  ngOnInit(): void {
    this.scroll.start();
    this.scroll.lock();

    // verificăm dacă există o sesiune activă și încărcăm datele contului
    this.auth.restore();
    setTimeout(() => {
      if (this.auth.user()) this.account.refresh();
    }, 400);
  }

  protected onIntroFinished(): void {
    this.ui.markReady();
    this.scroll.unlock();
  }
}
