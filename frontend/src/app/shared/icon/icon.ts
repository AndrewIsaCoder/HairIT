import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

interface IconShape {
  kind: 'path' | 'circle';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  filled?: boolean;
}

interface IconDefinition {
  box: number;
  stroked: boolean;
  strokeWidth?: number;
  shapes: IconShape[];
}

const path = (d: string, filled = false): IconShape => ({ kind: 'path', d, filled });
const circle = (cx: number, cy: number, r: number, filled = false): IconShape => ({
  kind: 'circle',
  cx,
  cy,
  r,
  filled
});

const ICONS = {
  spark: {
    box: 48,
    stroked: false,
    shapes: [path('M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z')]
  },
  'arrow-right': { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M5 12h14M13 6l6 6-6 6')] },
  'arrow-up-right': { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M7 17 17 7M8 7h9v9')] },
  'arrow-down': { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M12 5v14M6 13l6 6 6-6')] },
  star: {
    box: 24,
    stroked: false,
    shapes: [path('M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z')]
  },
  close: { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M4 4l16 16M20 4 4 20')] },
  menu: { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M4 6h16M4 12h16M4 18h16')] },
  check: { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M4 12.5l5 5L20 6.5')] },
  clock: { box: 24, stroked: true, strokeWidth: 1.6, shapes: [circle(12, 12, 9), path('M12 7v5.3l3.4 2')] },
  calendar: {
    box: 24,
    stroked: true,
    strokeWidth: 1.6,
    shapes: [
      path('M5.5 5.5h13A1.5 1.5 0 0 1 20 7v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5z'),
      path('M4 9.5h16M8 3.5v3M16 3.5v3')
    ]
  },
  phone: {
    box: 24,
    stroked: true,
    strokeWidth: 1.6,
    shapes: [path('M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z')]
  },
  user: { box: 24, stroked: true, strokeWidth: 1.6, shapes: [circle(12, 8, 3.5), path('M4.8 20a7.4 7.4 0 0 1 14.4 0')] },
  scissors: {
    box: 24,
    stroked: true,
    strokeWidth: 1.6,
    shapes: [circle(6.5, 17.5, 2.5), circle(6.5, 6.5, 2.5), path('M8.7 8.2 20 20.5M8.7 15.8 20 3.5')]
  },
  'map-pin': {
    box: 24,
    stroked: true,
    strokeWidth: 1.6,
    shapes: [path('M12 21.2s7-5.7 7-11.2a7 7 0 1 0-14 0c0 5.5 7 11.2 7 11.2z'), circle(12, 10, 2.6)]
  },
  'circle-dot': { box: 24, stroked: true, strokeWidth: 1.6, shapes: [circle(12, 12, 9), circle(12, 12, 3.2, true)] },
  heart: {
    box: 24,
    stroked: true,
    strokeWidth: 1.7,
    shapes: [path('M12 20.4S4.2 15.6 4.2 10.3A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.8 2.8c0 5.3-7.8 10.1-7.8 10.1z')]
  },
  'heart-filled': {
    box: 24,
    stroked: false,
    shapes: [path('M12 20.4S4.2 15.6 4.2 10.3A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.8 2.8c0 5.3-7.8 10.1-7.8 10.1z')]
  },
  search: { box: 24, stroked: true, strokeWidth: 1.8, shapes: [circle(11, 11, 7), path('M20 20l-3.6-3.6')] },
  bell: {
    box: 24,
    stroked: true,
    strokeWidth: 1.6,
    shapes: [path('M6 9.5a6 6 0 1 1 12 0c0 3.6 1.4 5 1.4 5H4.6s1.4-1.4 1.4-5z'), path('M10 18.6a2 2 0 0 0 4 0')]
  },
  logout: { box: 24, stroked: true, strokeWidth: 1.7, shapes: [path('M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6')] },
  'chevron-down': { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M6 9.5l6 6 6-6')] },
  plus: { box: 24, stroked: true, strokeWidth: 2, shapes: [path('M12 5v14M5 12h14')] },
  trash: { box: 24, stroked: true, strokeWidth: 1.7, shapes: [path('M4 7h16M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13')] },
  edit: { box: 24, stroked: true, strokeWidth: 1.7, shapes: [path('M4 20h4L18.5 9.5l-4-4L4 16v4z')] },
  filter: { box: 24, stroked: true, strokeWidth: 1.7, shapes: [path('M3.5 5.5h17l-6.8 8v5.2l-3.4 1.8v-7z')] },
  sparkles: { box: 24, stroked: true, strokeWidth: 1.6, shapes: [path('M12 3.5l1.6 4.3 4.3 1.6-4.3 1.6L12 15.3l-1.6-4.3L6.1 9.4l4.3-1.6z'), path('M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z')] },
  info: { box: 24, stroked: true, strokeWidth: 1.6, shapes: [circle(12, 12, 9), path('M12 11v5.5M12 7.6v.1')] },
  wallet: { box: 24, stroked: true, strokeWidth: 1.6, shapes: [path('M4 8.5A2 2 0 0 1 6 6.5h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z'), path('M16 12.5h3.5v3H16a1.5 1.5 0 0 1 0-3z')] },
  globe: {
    box: 24,
    stroked: true,
    strokeWidth: 1.4,
    shapes: [
      circle(12, 12, 9.25),
      path('M12 2.75c2.6 2.3 4 5.8 4 9.25s-1.4 6.95-4 9.25c-2.6-2.3-4-5.8-4-9.25s1.4-6.95 4-9.25zM2.75 12h18.5')
    ]
  }
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

/** Set de pictograme SVG inline, dimensionate in `em` si colorate cu `currentColor`. */
@Component({
  selector: 'hairit-icon',
  imports: [NgFor, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: inline-flex; line-height: 0; }'],
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      width="1em"
      height="1em"
      [attr.fill]="definition().stroked ? 'none' : 'currentColor'"
      [attr.stroke]="definition().stroked ? 'currentColor' : 'none'"
      [attr.stroke-width]="definition().strokeWidth ?? null"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <ng-container *ngFor="let shape of definition().shapes">
        <path *ngIf="shape.kind === 'path'" [attr.d]="shape.d" [attr.fill]="shape.filled ? 'currentColor' : null"></path>
        <circle
          *ngIf="shape.kind === 'circle'"
          [attr.cx]="shape.cx"
          [attr.cy]="shape.cy"
          [attr.r]="shape.r"
          [attr.fill]="shape.filled ? 'currentColor' : null"
        ></circle>
      </ng-container>
    </svg>
  `
})
export class Icon {
  readonly name = input.required<IconName>();

  protected readonly definition = computed<IconDefinition>(() => ICONS[this.name()]);
  protected readonly viewBox = computed(() => '0 0 ' + this.definition().box + ' ' + this.definition().box);
}
