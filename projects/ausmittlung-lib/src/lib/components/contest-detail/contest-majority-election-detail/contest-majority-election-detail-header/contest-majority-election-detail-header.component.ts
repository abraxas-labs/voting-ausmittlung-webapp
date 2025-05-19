/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SimplePoliticalBusiness } from '../../../../models';

@Component({
  selector: 'vo-ausm-contest-majority-election-detail-header',
  templateUrl: './contest-majority-election-detail-header.component.html',
  styleUrls: ['./contest-majority-election-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ContestMajorityElectionDetailHeaderComponent {
  @Input()
  public election!: SimplePoliticalBusiness;
}
