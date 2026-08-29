import { Injectable, inject, signal } from '@angular/core';
import { SmoothScroll } from './smooth-scroll';

/** Starea interfetei: overlay-uri, meniu si finalul animatiei de intrare. */
@Injectable({ providedIn: 'root' })
export class UiState {
  private readonly scroll = inject(SmoothScroll);

  /** devine true dupa ce ecranul de incarcare a disparut */
  readonly ready = signal(false);
  readonly menuOpen = signal(false);
  readonly modalOpen = signal(false);

  markReady(): void {
    this.ready.set(true);
  }

  openMenu(): void {
    if (this.menuOpen()) return;
    this.menuOpen.set(true);
    this.scroll.lock();
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.scroll.unlock();
  }

  openModal(): void {
    if (this.modalOpen()) return;
    this.closeMenu();
    this.modalOpen.set(true);
    this.scroll.lock();
  }

  closeModal(): void {
    if (!this.modalOpen()) return;
    this.modalOpen.set(false);
    this.scroll.unlock();
  }

  goTo(id: string): void {
    this.closeMenu();
    setTimeout(() => this.scroll.to(id), 60);
  }
}
