import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Icon, IconName } from '../icon/icon';

/** Mesaj afișat când o listă este goală. */
@Component({
  selector: 'hairit-empty-state',
  imports: [NgIf, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="empty__mark"><hairit-icon [name]="icon()" /></span>
      <p class="empty__title">{{ title() }}</p>
      <p class="empty__text" *ngIf="text()">{{ text() }}</p>
      <ng-content />
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        border: 1px dashed var(--line);
        border-radius: var(--radius-card);
        background: var(--surface);
        padding: 3rem 1.5rem;
        text-align: center;
      }

      .empty__mark {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border-radius: var(--radius-pill);
        background: #fff;
        color: var(--accent);
        font-size: 1.25rem;
      }

      .empty__title {
        font-size: 1.125rem;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      .empty__text {
        max-width: 40ch;
        font-size: 0.875rem;
        color: rgba(17, 17, 17, 0.55);
      }
    `
  ]
})
export class EmptyState {
  readonly icon = input<IconName>('calendar');
  readonly title = input('Nu am găsit nimic');
  readonly text = input('');
}
