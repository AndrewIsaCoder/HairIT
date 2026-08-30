import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Clock } from '../../core/services/clock';
import { UiState } from '../../core/services/ui-state';
import { AuthStore } from '../../core/services/auth-store';
import { AccountStore } from '../../core/services/account-store';

interface MenuLink {
  label: string;
  path: string;
  ownerOnly?: boolean;
  authOnly?: boolean;
}

/** Meniu pe tot ecranul, folosit pe ecrane mici. */
@Component({
  selector: 'hairit-nav-menu',
  imports: [NgFor, NgIf, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.css'
})
export class NavMenu {
  protected readonly ui = inject(UiState);
  protected readonly clock = inject(Clock);
  protected readonly auth = inject(AuthStore);
  private readonly account = inject(AccountStore);
  private readonly router = inject(Router);

  protected readonly links: MenuLink[] = [
    { label: 'Acasă', path: '/' },
    { label: 'Saloane', path: '/saloane' },
    { label: 'Contul meu', path: '/contul-meu', authOnly: true },
    { label: 'Salonul meu', path: '/salonul-meu', ownerOnly: true }
  ];

  protected visible(link: MenuLink): boolean {
    if (link.ownerOnly) return this.auth.isOwner();
    if (link.authOnly) return this.auth.isLoggedIn();
    return true;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.ui.closeMenu();
  }

  protected index(position: number): string {
    return String(position + 1).padStart(2, '0');
  }

  protected close(): void {
    this.ui.closeMenu();
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.account.clear();
        this.ui.closeMenu();
        this.router.navigate(['/']);
      }
    });
  }
}
