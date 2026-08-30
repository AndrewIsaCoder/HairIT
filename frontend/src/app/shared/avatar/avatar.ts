import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Cerc cu inițiale, folosit pentru specialiști și pentru utilizatorul autentificat. */
@Component({
  selector: 'hairit-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span class="avatar" [class.avatar--accent]="accent()">{{ text() }}</span>',
  styles: [
    `
      .avatar {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        min-width: 2.25rem;
        min-height: 2.25rem;
        border-radius: var(--radius-pill);
        background: var(--surface);
        color: rgba(17, 17, 17, 0.7);
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      .avatar--accent {
        background: var(--ink);
        color: var(--accent-from);
      }
    `
  ]
})
export class Avatar {
  readonly initials = input('');
  readonly name = input('');
  readonly accent = input(false);

  protected readonly text = computed(() => {
    const explicit = this.initials().trim();
    if (explicit) return explicit.toUpperCase();

    return this.name()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });
}
