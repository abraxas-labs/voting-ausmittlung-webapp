/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { ProportionalElectionBallotCandidate, ProportionalElectionOrBallotCandidate } from '../../../models';
import { ProportionalElectionBallotListPosition } from '../../../services/proportional-election-ballot-ui.service';

export interface CandidatePositionEvent {
  // indicates whether this event targets the candidate on the list (true) or the replacement candidate (false)
  listCandidate: boolean;
  position: ProportionalElectionBallotListPosition;
}

export interface AddCandidatePositionEvent extends CandidatePositionEvent {
  candidate?: ProportionalElectionOrBallotCandidate;
}

export interface RemoveCandidatePositionEvent extends CandidatePositionEvent {
  candidate: ProportionalElectionBallotCandidate;
}

@Component({
  selector: 'vo-ausm-proportional-election-ballot-candidates',
  templateUrl: './proportional-election-ballot-candidates.component.html',
  styleUrls: ['./proportional-election-ballot-candidates.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotCandidatesComponent {
  @Input()
  public positions: ProportionalElectionBallotListPosition[] = [];

  @Input()
  public readonly: boolean = true;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public addCandidate: EventEmitter<AddCandidatePositionEvent> = new EventEmitter<AddCandidatePositionEvent>();

  @Output()
  public removeCandidate: EventEmitter<RemoveCandidatePositionEvent> = new EventEmitter<RemoveCandidatePositionEvent>();

  @ViewChildren('positionElement', { read: ElementRef })
  public positionElements!: QueryList<ElementRef>;

  public addNewCandidate(position: ProportionalElectionBallotListPosition): void {
    if (!position.isSlotAvailable) {
      return;
    }

    this.addCandidate.emit({ position, listCandidate: false });
  }

  public toggleCandidate(position: ProportionalElectionBallotListPosition, candidate: ProportionalElectionBallotCandidate): void {
    if (this.readonly) {
      return;
    }

    if (position.listCandidate !== candidate) {
      if (position.replacementCandidate) {
        this.removeCandidate.emit({ position, candidate, listCandidate: false });
      } else {
        this.addCandidate.emit({ position, candidate, listCandidate: false });
      }
      return;
    }

    if (!position.listCandidate) {
      return;
    }

    if (position.listCandidate.removedFromList) {
      if (position.replacementCandidate) {
        this.removeCandidate.emit({ position, candidate: position.replacementCandidate, listCandidate: false });
      }

      this.addCandidate.emit({ position, candidate, listCandidate: true });
    } else {
      this.removeCandidate.emit({ position, candidate, listCandidate: true });
    }
  }
}
