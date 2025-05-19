/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DoubleProportionalResult,
  DoubleProportionalResultApportionmentState,
  ProportionalElectionMandateAlgorithm,
} from 'ausmittlung-lib';

const defaultGridRows = 4;

@Component({
  selector: 'app-double-proportional-result-super-apportionment',
  templateUrl: './double-proportional-result-super-apportionment.component.html',
  styleUrls: ['./double-proportional-result-super-apportionment.component.scss'],
  standalone: false,
})
export class DoubleProportionalResultSuperApportionmentComponent {
  private doubleProportionalResultValue?: DoubleProportionalResult;
  public readonly dpResultApportionmentState: typeof DoubleProportionalResultApportionmentState =
    DoubleProportionalResultApportionmentState;

  public showCantonalQuorum = false;
  public showElectionQuorum = false;
  public gridTemplateRowsStyle = '';

  public get doubleProportionalResult(): DoubleProportionalResult | undefined {
    return this.doubleProportionalResultValue;
  }

  @Input()
  public set doubleProportionalResult(v: DoubleProportionalResult | undefined) {
    if (v === this.doubleProportionalResultValue) {
      return;
    }

    this.doubleProportionalResultValue = v;

    if (!v) {
      return;
    }
    this.showCantonalQuorum =
      v.mandateAlgorithm ===
      ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_DOUBLE_PROPORTIONAL_N_DOIS_5_DOI_OR_3_TOT_QUORUM;
    this.showElectionQuorum =
      v.mandateAlgorithm ===
        ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_DOUBLE_PROPORTIONAL_N_DOIS_5_DOI_OR_3_TOT_QUORUM ||
      v.mandateAlgorithm ===
        ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_DOUBLE_PROPORTIONAL_N_DOIS_5_DOI_QUORUM;

    let additionalGridRows = 0;

    if (this.showCantonalQuorum) {
      additionalGridRows++;
    }

    if (this.showElectionQuorum) {
      additionalGridRows++;
    }

    this.gridTemplateRowsStyle = `repeat(${defaultGridRows + additionalGridRows}, min-content)`;
  }

  @Output()
  public update: EventEmitter<void> = new EventEmitter<void>();

  public handleLotDecisionUpdate(): void {
    this.update.emit();
  }
}
