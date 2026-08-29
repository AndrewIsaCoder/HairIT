import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { Clock } from '../../core/services/clock';
import { UiState } from '../../core/services/ui-state';

export interface NavLink {
  label: string;
  target: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Acasă', target: 'acasa' },
  { label: 'Servicii', target: 'servicii' },
  { label: 'Programări', target: 'programari' },
  { label: 'Echipă', target: 'echipa' },
  { label: 'Contact', target: 'contact' }
];

/** Bara de navigare fixa, transparenta peste hero si opaca la derulare. */
@Component({
  selector: 'hairit-site-header',
  imports: [NgFor, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  host: { '[class.is-pinned]': 'pinned()' }
})
export class SiteHeader {
  protected readonly clock = inject(Clock);
  protected readonly ui = inject(UiState);
  protected readonly links = NAV_LINKS;
  protected readonly pinned = signal(false);

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.pinned.set(window.scrollY > 80);
  }

  protected go(target: string): void {
    this.ui.goTo(target);
  }
}
