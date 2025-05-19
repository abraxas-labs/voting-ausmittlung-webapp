/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vo-ausm-contest-detail-submission-tile',
  templateUrl: './contest-detail-submission-tile.component.html',
  styleUrls: ['./contest-detail-submission-tile.component.scss'],
  standalone: false,
})
export class ContestDetailSubmissionTileComponent {
  @Input()
  public titleText?: string;

  @Input()
  public text?: string;

  @Input()
  public disabled: boolean = false;

  @Input()
  public buttonText: string = 'POLITICAL_BUSINESS.SUBMIT';

  @Output()
  public buttonClick: EventEmitter<void> = new EventEmitter<void>();
}
