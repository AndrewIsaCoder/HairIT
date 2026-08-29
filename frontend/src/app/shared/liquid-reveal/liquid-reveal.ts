import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  input,
  viewChild
} from '@angular/core';

const BRUSH_RADIUS = 143;
const DECAY = 0.016;
const IDLE_FRAMES = 120;

/**
 * Efect „liquid reveal”: imaginea de baza este mereu vizibila, iar a doua
 * imagine este pictata pe traseul cursorului cu o pensula moale.
 */
@Component({
  selector: 'hairit-liquid-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host { position: absolute; inset: 0; display: block; overflow: hidden; }
      img, canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      img { object-fit: cover; }
      canvas { pointer-events: none; }
    `
  ],
  template: `
    <img [src]="base()" [alt]="alt()" fetchpriority="high" decoding="async" />
    <canvas #surface aria-hidden="true"></canvas>
  `
})
export class LiquidReveal implements AfterViewInit, OnDestroy {
  /** imaginea vizibila permanent */
  readonly base = input.required<string>();
  /** imaginea dezvaluita sub cursor */
  readonly reveal = input.required<string>();
  readonly alt = input('');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly surface = viewChild.required<ElementRef<HTMLCanvasElement>>('surface');

  private context: CanvasRenderingContext2D | null = null;
  private cover: HTMLCanvasElement | null = null;
  private brush: HTMLCanvasElement | null = null;
  private image: HTMLImageElement | null = null;

  private dpr = 1;
  private radius = BRUSH_RADIUS;
  private diameter = BRUSH_RADIUS * 2;
  private points: Array<{ x: number; y: number }> = [];
  private last: { x: number; y: number } | null = null;
  private idle = 0;
  private frame = 0;
  private observer?: ResizeObserver;
  private readonly onPointerMove = (event: PointerEvent) => this.trace(event);

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = this.surface().nativeElement;
    this.context = canvas.getContext('2d');
    if (!this.context) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.radius = BRUSH_RADIUS * this.dpr;
    this.diameter = Math.ceil(this.radius * 2);

    this.brush = document.createElement('canvas');
    this.brush.width = this.diameter;
    this.brush.height = this.diameter;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.src = this.reveal();
    image.onload = () => {
      this.image = image;
      this.measure();
    };

    this.zone.runOutsideAngular(() => {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(this.host.nativeElement as HTMLElement);
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      this.frame = requestAnimationFrame(() => this.tick());
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.onPointerMove);
    }
  }

  /** Recalculeaza dimensiunile pentru canvas si pentru imaginea „cover”. */
  private measure(): void {
    const canvas = this.surface().nativeElement;
    const rect = (this.host.nativeElement as HTMLElement).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.round(rect.width * this.dpr);
    canvas.height = Math.round(rect.height * this.dpr);

    if (!this.image) return;

    const cover = this.cover ?? document.createElement('canvas');
    cover.width = canvas.width;
    cover.height = canvas.height;

    const ctx = cover.getContext('2d');
    if (!ctx) return;

    const scale = Math.max(cover.width / this.image.width, cover.height / this.image.height);
    const width = this.image.width * scale;
    const height = this.image.height * scale;
    ctx.clearRect(0, 0, cover.width, cover.height);
    ctx.drawImage(this.image, (cover.width - width) / 2, (cover.height - height) / 2, width, height);

    this.cover = cover;
  }

  /** Interpoleaza punctele intre doua pozitii ale cursorului. */
  private trace(event: PointerEvent): void {
    const canvas = this.surface().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * this.dpr;
    const y = (event.clientY - rect.top) * this.dpr;

    const outside =
      x < -this.radius || y < -this.radius || x > canvas.width + this.radius || y > canvas.height + this.radius;

    if (outside) {
      this.last = null;
      return;
    }

    if (!this.last) {
      this.points.push({ x, y });
      this.last = { x, y };
      return;
    }

    const dx = x - this.last.x;
    const dy = y - this.last.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.max(this.radius * 0.3, 1);
    const count = Math.min(Math.ceil(distance / step), 60);

    for (let i = 1; i <= count; i += 1) {
      this.points.push({ x: this.last.x + (dx * i) / count, y: this.last.y + (dy * i) / count });
    }

    this.last = { x, y };
  }

  private tick(): void {
    this.frame = requestAnimationFrame(() => this.tick());

    const ctx = this.context;
    const canvas = this.surface().nativeElement;
    if (!ctx || !this.cover) return;

    const drawing = this.points.length > 0;
    if (drawing) {
      this.idle = 0;
    } else {
      this.idle += 1;
      if (this.idle > IDLE_FRAMES + 1) return;
    }

    const fade = drawing ? DECAY : Math.min(DECAY + this.idle * 0.004, 0.5);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, ' + fade + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    if (drawing) {
      for (const point of this.points) this.stamp(point.x, point.y);
      this.points = [];
    } else if (this.idle === IDLE_FRAMES) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /** Aplica o pensula moale cu pixelii imaginii dezvaluite. */
  private stamp(x: number, y: number): void {
    const brush = this.brush;
    const cover = this.cover;
    const ctx = this.context;
    if (!brush || !cover || !ctx) return;

    const brushCtx = brush.getContext('2d');
    if (!brushCtx) return;

    const center = this.diameter / 2;
    brushCtx.clearRect(0, 0, this.diameter, this.diameter);
    brushCtx.globalCompositeOperation = 'source-over';

    const gradient = brushCtx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.82)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    brushCtx.fillStyle = gradient;
    brushCtx.fillRect(0, 0, this.diameter, this.diameter);

    brushCtx.globalCompositeOperation = 'source-in';
    brushCtx.drawImage(cover, x - center, y - center, this.diameter, this.diameter, 0, 0, this.diameter, this.diameter);

    ctx.drawImage(brush, x - center, y - center);
  }
}
