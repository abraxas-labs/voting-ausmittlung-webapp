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
  public bundlesWithBallotGroupEnabled: boolean = false;

  @Input()
  public positions: MajorityElectionBallotPosition[] = [];

  @Output()
  public addCandidate: EventEmitter<MajorityElectionBallotPosition> = new EventEmitter<MajorityElectionBallotPosition>();

  @Output()
  public restoreCandidate: EventEmitter<MajorityElectionBallotPosition> = new EventEmitter<MajorityElectionBallotPosition>();

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

  public canToggleGroupCandidate(position: MajorityElectionBallotPosition): boolean {
    return (
      !this.readonly &&
      !!position.ballotGroupCandidate &&
      (position.ballotGroupCandidate.selected ||
        (!this.candidates.some(c => c.id === position.ballotGroupCandidate!.id && c.selected) &&
          (!!position.replacementCandidate || this.hasEmptyVotes)))
    );
  }

  public toggleGroupCandidate(position: MajorityElectionBallotPosition): void {
    if (!this.canToggleGroupCandidate(position)) {
      return;
    }
    if (position.ballotGroupCandidate!.selected) {
      this.toggleCandidate.emit(position.ballotGroupCandidate!);
    } else {
      this.restoreCandidate.emit(position);
    }
  }

  public addNewCandidate(position: MajorityElectionBallotPosition): void {
    if (!this.readonly && this.hasEmptyVotes && !position.ballotGroupCandidate?.selected && !position.replacementCandidate) {
      this.addCandidate.emit(position);
    }
  }
}

export interface MajorityElectionBallotPosition {
  position: number;
  ballotGroupCandidate?: MajorityElectionBallotCandidate;
  replacementCandidate?: MajorityElectionBallotCandidate;
}
