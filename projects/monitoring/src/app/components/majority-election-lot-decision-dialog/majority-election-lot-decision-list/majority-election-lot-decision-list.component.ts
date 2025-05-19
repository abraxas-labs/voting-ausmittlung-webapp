/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import {
  MajorityElectionEndResultAvailableLotDecision,
  MajorityElectionEndResultAvailableLotDecisions,
  SecondaryMajorityElectionEndResultAvailableLotDecisions,
} from 'ausmittlung-lib';

@Component({
  selector: 'app-majority-election-lot-decision-list',
  templateUrl: './majority-election-lot-decision-list.component.html',
  styleUrls: ['./majority-election-lot-decision-list.component.scss'],
  standalone: false,
})
export class MajorityElectionLotDecisionListComponent implements OnChanges {
  @Input()
  public lotDecisions!: MajorityElectionEndResultAvailableLotDecisions | SecondaryMajorityElectionEndResultAvailableLotDecisions;

  @Input()
  public disabled: boolean = false;

  @Input()
  public showTitle: boolean = false;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();

  public hasAnyRequiredLotDecisions: boolean = false;

  public updateSelectedRank(lotDecision: MajorityElectionEndResultAvailableLotDecision, v: number): void {
    if (v === lotDecision.selectedRank) {
      return;
    }

    lotDecision.selectedRank = v;
    this.contentChanged.emit();
  }

  public ngOnChanges(): void {
    this.hasAnyRequiredLotDecisions = !!this.lotDecisions && this.lotDecisions.lotDecisions.some(l => l.lotDecisionRequired);
  }
}
