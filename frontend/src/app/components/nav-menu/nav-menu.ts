import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { Clock } from '../../core/services/clock';
import { UiState } from '../../core/services/ui-state';
import { NAV_LINKS } from '../site-header/site-header';

/** Meniu principal pe tot ecranul, deschis din butonul „Meniu”. */
@Component({
  selector: 'hairit-nav-menu',
  imports: [NgFor, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.css'
})
export class NavMenu {
  protected readonly ui = inject(UiState);
  protected readonly clock = inject(Clock);
  protected readonly links = NAV_LINKS;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.ui.closeMenu();
  }

  protected index(position: number): string {
    return String(position + 1).padStart(2, '0');
  }
}
