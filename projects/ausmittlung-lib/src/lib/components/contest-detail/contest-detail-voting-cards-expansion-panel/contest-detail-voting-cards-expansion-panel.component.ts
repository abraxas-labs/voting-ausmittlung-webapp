/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-contest-detail-voting-cards-expansion-panel',
  templateUrl: './contest-detail-voting-cards-expansion-panel.component.html',
  styleUrls: ['./contest-detail-voting-cards-expansion-panel.component.scss'],
  standalone: false,
})
export class ContestDetailVotingCardsExpansionPanelComponent {
  @Input()
  public expanded: boolean = true;

  @Input()
  public header: string = '';
}
