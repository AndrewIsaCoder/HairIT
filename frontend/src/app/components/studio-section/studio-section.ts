import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { IconName } from '../../shared/icon/icon';
import { Reveal } from '../../shared/reveal/reveal';
import { UiState } from '../../core/services/ui-state';

interface BandTile {
  word?: string;
  icon?: IconName;
  variant: 'light' | 'accent' | 'dark' | 'ghost';
}

/** Sectiunea editoriala despre salon, cu banda de cuvinte si declaratia de intentie. */
@Component({
  selector: 'hairit-studio-section',
  imports: [NgFor, NgIf, Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './studio-section.html',
  styleUrl: './studio-section.css'
})
export class StudioSection {
  protected readonly ui = inject(UiState);

  protected readonly band: BandTile[] = [
    { word: 'Noi', variant: 'light' },
    { word: 'Creăm', variant: 'accent' },
    { icon: 'arrow-right', variant: 'dark' },
    { word: 'Stil', variant: 'ghost' }
  ];
}
