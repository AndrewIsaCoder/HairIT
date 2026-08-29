import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, output, signal } from '@angular/core';

import { Icon } from '../../shared/icon/icon';

const FILL_MS = 1300;
const EXIT_MS = 700;

/** Ecran de intrare: numara 000 -> 100, apoi urca si elibereaza pagina. */
@Component({
  selector: 'hairit-page-loader',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-loader.html',
  styleUrl: './page-loader.css',
  host: { '[class.is-leaving]': 'leaving()' }
})
export class PageLoader implements OnInit, OnDestroy {
  /** se emite dupa ce panoul a iesit complet din ecran */
  readonly finished = output<void>();

  protected readonly progress = signal(0);
  protected readonly leaving = signal(false);

  private frame = 0;
  private timeout?: ReturnType<typeof setTimeout>;

  protected get label(): string {
    return String(this.progress()).padStart(3, '0');
  }

  ngOnInit(): void {
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min((now - started) / FILL_MS, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.progress.set(Math.round(eased * 100));

      if (t < 1) {
        this.frame = requestAnimationFrame(step);
        return;
      }
      this.leaving.set(true);
      this.timeout = setTimeout(() => this.finished.emit(), EXIT_MS);
    };

    this.frame = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    if (this.timeout) clearTimeout(this.timeout);
  }
}
