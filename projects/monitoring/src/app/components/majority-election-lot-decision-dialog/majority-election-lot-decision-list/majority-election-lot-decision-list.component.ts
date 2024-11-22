/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnChanges } from '@angular/core';
import { MajorityElectionEndResultAvailableLotDecisions, SecondaryMajorityElectionEndResultAvailableLotDecisions } from 'ausmittlung-lib';

@Component({
  selector: 'app-majority-election-lot-decision-list',
  templateUrl: './majority-election-lot-decision-list.component.html',
  styleUrls: ['./majority-election-lot-decision-list.component.scss'],
})
export class MajorityElectionLotDecisionListComponent implements OnChanges {
  @Input()
  public lotDecisions!: MajorityElectionEndResultAvailableLotDecisions | SecondaryMajorityElectionEndResultAvailableLotDecisions;

  @Input()
  public showTitle: boolean = false;

  public hasAnyRequiredLotDecisions: boolean = false;

  public ngOnChanges(): void {
    this.hasAnyRequiredLotDecisions = !!this.lotDecisions && this.lotDecisions.lotDecisions.some(l => l.lotDecisionRequired);
  }
}
