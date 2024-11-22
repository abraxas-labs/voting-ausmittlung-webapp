/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { MajorityElectionResult } from '../../../models';

@Component({
  selector: 'vo-ausm-majority-election-info',
  templateUrl: './majority-election-info.component.html',
})
export class MajorityElectionInfoComponent {
  @Input()
  public electionResult!: MajorityElectionResult;
}
