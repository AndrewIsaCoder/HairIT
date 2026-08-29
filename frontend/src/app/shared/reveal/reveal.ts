import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Adauga clasa `.is-visible` cand elementul intra in viewport.
 * Animatia efectiva este definita in `styles.css` (clasa `.reveal`).
 */
@Directive({
  selector: '[hairitReveal]',
  host: { class: 'reveal', '[style.--reveal-delay.ms]': 'delay()' }
})
export class Reveal implements OnInit, OnDestroy {
  /** intarzierea animatiei, folosita pentru efectul de cascada */
  readonly delay = input(0, { alias: 'hairitReveal', transform: (value: number | string) => Number(value) || 0 });

  private readonly host = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this.host.nativeElement as HTMLElement;

    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.classList.add('is-visible');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
