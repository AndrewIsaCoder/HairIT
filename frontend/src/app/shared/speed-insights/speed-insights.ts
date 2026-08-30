import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Componenta pentru Vercel Speed Insights.
 * Injecteaza script-ul de monitorizare a performantei paginii.
 */
@Component({
  selector: 'hairit-speed-insights',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ''
})
export class SpeedInsights implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Speed Insights functioneaza doar in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Injectam Speed Insights cu configurare pentru Angular
    injectSpeedInsights({
      framework: 'angular'
    });
  }
}
