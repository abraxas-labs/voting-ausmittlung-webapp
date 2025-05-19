/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MajorityElectionBallotCandidate } from '../../../models';

@Component({
  selector: 'vo-ausm-majority-election-ballot-candidates',
  templateUrl: './majority-election-ballot-candidates.component.html',
  styleUrls: ['./majority-election-ballot-candidates.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotCandidatesComponent {
  @Input()
  public candidates: MajorityElectionBallotCandidate[] = [];

  @Input()
  public hasEmptyVotes: boolean = false;

  @Input()
  public readonly: boolean = true;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public toggleCandidate: EventEmitter<MajorityElectionBallotCandidate> = new EventEmitter<MajorityElectionBallotCandidate>();

  public emitToggleCandidate(candidate: MajorityElectionBallotCandidate, selected?: boolean): void {
    if (candidate.selected === selected) {
      return;
    }

    if (!this.readonly && !!candidate && (candidate.selected || this.hasEmptyVotes)) {
      this.toggleCandidate.emit(candidate);
    }
  }
}
