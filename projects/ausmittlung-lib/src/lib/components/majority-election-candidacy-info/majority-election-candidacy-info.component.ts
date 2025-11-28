/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { MajorityElectionCandidate } from '../../models';

@Component({
  selector: 'vo-ausm-majority-election-candidacy-info',
  templateUrl: './majority-election-candidacy-info.component.html',
  styleUrl: './majority-election-candidacy-info.component.scss',
  standalone: false,
})
export class MajorityElectionCandidacyInfoComponent {
  @Input()
  public candidate!: MajorityElectionCandidate;
}
