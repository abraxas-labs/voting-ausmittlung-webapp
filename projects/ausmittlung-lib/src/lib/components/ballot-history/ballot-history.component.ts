/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { PoliticalBusinessResultBallotLog } from '../../models';

@Component({
  selector: 'vo-ausm-ballot-history',
  templateUrl: './ballot-history.component.html',
  standalone: false,
})
export class BallotHistoryComponent {
  @Input({ required: true })
  public logs?: PoliticalBusinessResultBallotLog[];

  @Input({ required: true })
  public header!: string;
}
