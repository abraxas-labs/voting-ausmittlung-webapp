/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { PoliticalBusinessCountOfVoters } from '../../../../../../ausmittlung-lib/src/lib/models';

@Component({
  selector: 'app-ballot-end-result-count-of-voters',
  templateUrl: './ballot-end-result-count-of-voters.component.html',
  styleUrls: ['./ballot-end-result-count-of-voters.component.scss'],
  standalone: false,
})
export class BallotEndResultCountOfVotersComponent {
  @Input()
  public countOfVoters!: PoliticalBusinessCountOfVoters;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;
}
