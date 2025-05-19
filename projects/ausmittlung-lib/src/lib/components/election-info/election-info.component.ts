/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { MajorityElectionResult, ProportionalElectionResult } from '../../models';

@Component({
  selector: 'vo-ausm-election-info',
  templateUrl: './election-info.component.html',
  standalone: false,
})
export class ElectionInfoComponent {
  @Input()
  public numberOfMandatesHeader: string = '';

  @Input()
  public electionResult!: ProportionalElectionResult | MajorityElectionResult;
}
