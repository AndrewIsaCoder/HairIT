import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { AuthStore } from '../../core/services/auth-store';

interface FooterColumn {
  title: string;
  links: Array<{ label: string; path?: string; href?: string }>;
}

@Component({
  selector: 'hairit-site-footer',
  imports: [NgFor, NgIf, RouterLink, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css'
})
export class SiteFooter {
  protected readonly auth = inject(AuthStore);
  protected readonly year = new Date().getFullYear();

  protected readonly columns: FooterColumn[] = [
    {
      title: 'Platformă',
      links: [
        { label: 'Caută saloane', path: '/saloane' },
        { label: 'Contul meu', path: '/contul-meu' },
        { label: 'Cont nou', path: '/inregistrare' },
        { label: 'Autentificare', path: '/autentificare' }
      ]
    },
    {
      title: 'Pentru saloane',
      links: [
        { label: 'Înscrie-ți salonul', path: '/salon-nou' },
        { label: 'Panoul salonului', path: '/salonul-meu' },
        { label: 'Cum funcționează', path: '/' }
      ]
    },
    {
      title: 'Contact',
      links: [
        { label: 'salut@hairit.ro', href: 'mailto:salut@hairit.ro' },
        { label: '+40 21 555 0142', href: 'tel:+40215550142' },
        { label: 'Luni–Sâmbătă, 09:00–19:30' }
      ]
    }
  ];
}
