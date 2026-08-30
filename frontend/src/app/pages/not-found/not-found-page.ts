import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'hairit-not-found-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="missing shell">
      <p class="missing__code">404</p>
      <h1 class="missing__title">Pagina nu există</h1>
      <p class="missing__text">
        Linkul pe care l-ai deschis nu duce nicăieri. Poate salonul căutat și-a schimbat adresa.
      </p>
      <div class="missing__actions">
        <a class="pill pill--dark pill--arrow" routerLink="/saloane">
          Caută saloane
          <span class="pill__badge"><hairit-icon name="arrow-right" /></span>
        </a>
        <a class="pill pill--outline" routerLink="/">Înapoi acasă</a>
      </div>
    </section>
  `,
  styles: [
    `
      .missing {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding-block: 7rem 9rem;
        text-align: center;
      }

      .missing__code {
        font-size: 5rem;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--surface-2);
      }

      .missing__title {
        font-size: 2rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .missing__text {
        max-width: 42ch;
        font-size: 0.95rem;
        color: rgba(17, 17, 17, 0.55);
      }

      .missing__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 1rem;
      }
    `
  ]
})
export class NotFoundPage {}
