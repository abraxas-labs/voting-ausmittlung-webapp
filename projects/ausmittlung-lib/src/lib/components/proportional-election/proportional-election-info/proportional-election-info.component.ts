/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProportionalElectionResult } from '../../../models';

@Component({
  selector: 'vo-ausm-proportional-election-info',
  templateUrl: './proportional-election-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProportionalElectionInfoComponent {
  @Input()
  public electionResult!: ProportionalElectionResult;
}
