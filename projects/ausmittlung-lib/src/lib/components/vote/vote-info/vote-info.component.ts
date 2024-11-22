/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { VoteResult } from '../../../models';

@Component({
  selector: 'vo-ausm-vote-info',
  templateUrl: './vote-info.component.html',
})
export class VoteInfoComponent {
  @Input()
  public voteResult!: VoteResult;
}
