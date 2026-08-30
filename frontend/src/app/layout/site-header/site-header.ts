import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { AuthStore } from '../../core/services/auth-store';
import { AccountStore } from '../../core/services/account-store';
import { UiState } from '../../core/services/ui-state';
import { relativeTime } from '../../core/utils/format';

/** Bara de navigare: căutare, notificări și meniul contului. */
@Component({
  selector: 'hairit-site-header',
  imports: [NgIf, NgFor, NgClass, RouterLink, RouterLinkActive, Icon, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  host: { '[class.is-pinned]': 'pinned() || !overHero()' }
})
export class SiteHeader {
  protected readonly auth = inject(AuthStore);
  protected readonly account = inject(AccountStore);
  protected readonly ui = inject(UiState);
  private readonly router = inject(Router);

  protected readonly pinned = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly bellOpen = signal(false);
  protected readonly search = signal('');

  /** pe pagina principală bara stă peste imaginea mare, transparentă */
  protected readonly overHero = signal(this.router.url === '/');

  protected readonly relative = relativeTime;
  protected readonly notifications = computed(() => this.account.notifications().slice(0, 6));

  constructor() {
    this.router.events.subscribe(() => {
      this.overHero.set(this.router.url === '/' || this.router.url.startsWith('/?'));
      this.menuOpen.set(false);
      this.bellOpen.set(false);
    });
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.pinned.set(window.scrollY > 40);
  }

  @HostListener('document:keydown.escape')
  protected closeAll(): void {
    this.menuOpen.set(false);
    this.bellOpen.set(false);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    const term = this.search().trim();
    this.router.navigate(['/saloane'], { queryParams: term ? { q: term } : {} });
  }

  protected onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected toggleBell(): void {
    this.menuOpen.set(false);
    this.bellOpen.update((open) => !open);
    if (this.bellOpen()) this.account.loadNotifications();
  }

  protected toggleMenu(): void {
    this.bellOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  protected markAllRead(): void {
    this.account.markAllRead();
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.account.clear();
        this.menuOpen.set(false);
        this.router.navigate(['/']);
      }
    });
  }
}
