import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { UiState } from '../../core/services/ui-state';

interface FooterColumn {
  title: string;
  links: Array<{ label: string; target?: string; href?: string }>;
}

@Component({
  selector: 'hairit-site-footer',
  imports: [NgFor, NgIf, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css'
})
export class SiteFooter {
  protected readonly ui = inject(UiState);
  protected readonly year = new Date().getFullYear();

  protected readonly columns: FooterColumn[] = [
    {
      title: 'Salon',
      links: [
        { label: 'Despre noi', target: 'studio' },
        { label: 'Echipa', target: 'echipa' },
        { label: 'Servicii', target: 'servicii' },
        { label: 'Programări', target: 'programari' }
      ]
    },
    {
      title: 'Contact',
      links: [
        { label: 'Str. Dorobanți 42, București', href: 'https://maps.google.com' },
        { label: '+40 21 555 0142', href: 'tel:+40215550142' },
        { label: 'salut@hairit.ro', href: 'mailto:salut@hairit.ro' },
        { label: 'Luni–Sâmbătă, 09:00–19:30' }
      ]
    },
    {
      title: 'Social',
      links: [
        { label: 'Instagram', href: 'https://instagram.com' },
        { label: 'Facebook', href: 'https://facebook.com' },
        { label: 'TikTok', href: 'https://tiktok.com' },
        { label: 'Google Reviews', href: 'https://google.com' }
      ]
    }
  ];
}
