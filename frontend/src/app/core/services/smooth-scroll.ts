import { Injectable, NgZone, inject } from '@angular/core';
import Lenis from 'lenis';

/**
 * Scroll fluid (Lenis) plus blocarea scroll-ului cand este deschis un overlay.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScroll {
  private readonly zone = inject(NgZone);
  private lenis: Lenis | null = null;
  private frame = 0;
  private locks = 0;

  start(): void {
    if (this.lenis || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({ smoothWheel: true, duration: 1.05 });

      const raf = (time: number) => {
        this.lenis?.raf(time);
        this.frame = requestAnimationFrame(raf);
      };
      this.frame = requestAnimationFrame(raf);
    });
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.lenis?.destroy();
    this.lenis = null;
  }

  lock(): void {
    this.locks += 1;
    if (this.locks === 1) {
      this.lenis?.stop();
      document.documentElement.classList.add('is-locked');
      document.body.classList.add('is-locked');
    }
  }

  unlock(): void {
    this.locks = Math.max(0, this.locks - 1);
    if (this.locks === 0) {
      this.lenis?.start();
      document.documentElement.classList.remove('is-locked');
      document.body.classList.remove('is-locked');
    }
  }

  /** Deruleaza catre o sectiune identificata prin id. */
  to(id: string): void {
    const target = document.getElementById(id);
    if (!target) return;

    if (this.lenis) {
      this.lenis.scrollTo(target, { offset: -12, duration: 1.2 });
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
