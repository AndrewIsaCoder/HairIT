import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

/** Cadrul comun al paginilor de autentificare: imagine editorială și formular. */
@Component({
  selector: 'hairit-auth-shell',
  imports: [NgFor, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css'
})
export class AuthShell {
  readonly eyebrow = input('Cont HairIT');
  readonly title = input('Bine ai revenit');
  readonly image = input('images/editorial-portrait.jpg');

  protected readonly points = [
    'Rezervi în câteva secunde, fără telefoane',
    'Îți vezi toate programările într-un singur loc',
    'Primești notificări la confirmare și anulare'
  ];
}
