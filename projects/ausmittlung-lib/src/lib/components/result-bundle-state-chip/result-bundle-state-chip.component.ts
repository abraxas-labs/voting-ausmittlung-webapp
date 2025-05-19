/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { BallotBundleState } from '../../models';

@Component({
  selector: 'vo-ausm-result-bundle-state-chip',
  templateUrl: './result-bundle-state-chip.component.html',
  standalone: false,
})
export class ResultBundleStateChipComponent {
  public stateValue!: BallotBundleState;
  public color!: string;
  public foregroundColor: 'dark' | 'light' = 'dark';

  @Input()
  public set state(state: BallotBundleState) {
    this.stateValue = state;
    this.updateStateColor(state);
  }

  private updateStateColor(state: BallotBundleState): void {
    switch (state) {
      case BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW:
        this.color = '#c4e6c3';
        this.foregroundColor = 'dark';
        break;
      case BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED:
        this.color = '#95d2a4';
        this.foregroundColor = 'dark';
        break;
      case BallotBundleState.BALLOT_BUNDLE_STATE_DELETED:
      case BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION:
        this.color = '#fec6c3';
        this.foregroundColor = 'dark';
        break;
      default:
        this.color = '#fbe5c4';
        this.foregroundColor = 'dark';
    }
  }
}
