/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ProportionalElectionBallotCandidate, ProportionalElectionResult, ProportionalElectionResultBallot } from '../../../models';
import {
  ProportionalElectionBallotUiData,
  ProportionalElectionBallotUiService,
} from '../../../services/proportional-election-ballot-ui.service';
import { ProportionalElectionBallotCandidateModifyComponent } from '../proportional-election-ballot-candidate-modify/proportional-election-ballot-candidate-modify.component';
import { RemoveCandidateRangeData } from '../proportional-election-ballot-candidate-remove-range/proportional-election-ballot-candidate-remove-range.component';
import {
  ProportionalElectionBallotCandidatesChooseDialogComponent,
  ProportionalElectionBallotCandidatesChooseDialogData,
} from '../proportional-election-ballot-candidates-choose-dialog/proportional-election-ballot-candidates-choose-dialog.component';
import {
  AddCandidatePositionEvent,
  CandidatePositionEvent,
  ProportionalElectionBallotCandidatesComponent,
} from '../proportional-election-ballot-candidates/proportional-election-ballot-candidates.component';

@Component({
  selector: 'vo-ausm-proportional-election-ballot-content',
  templateUrl: './proportional-election-ballot-content.component.html',
  styleUrls: ['./proportional-election-ballot-content.component.scss'],
})
export class ProportionalElectionBallotContentComponent {
  @Input()
  public ballot!: ProportionalElectionResultBallot;

  @Input()
  public ballotUiData!: ProportionalElectionBallotUiData;

  @Input()
  public electionResult!: ProportionalElectionResult;

  @Input()
  public readonly: boolean = true;

  @Input()
  public disabled: boolean = true;

  @Input()
  public showRemoveRange: boolean = false;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public contentCompleted: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

  @ViewChild(ProportionalElectionBallotCandidateModifyComponent)
  private proportionalElectionBallotCandidateModifyComponent?: ProportionalElectionBallotCandidateModifyComponent;

  @ViewChild(ProportionalElectionBallotCandidatesComponent)
  private proportionalElectionBallotCandidatesComponent?: ProportionalElectionBallotCandidatesComponent;

  constructor(
    private readonly ballotUiService: ProportionalElectionBallotUiService,
    private readonly dialogService: DialogService,
  ) {}

  public async removeCandidateAtPosition({ position, listCandidate }: CandidatePositionEvent): Promise<void> {
    this.ballotUiService.removeCandidateAtPosition(position, listCandidate, this.ballotUiData);
    this.contentChanged.emit();
  }

  public removeCandidate(candidate: ProportionalElectionBallotCandidate | undefined): void {
    if (!candidate) {
      return;
    }

    const position = this.ballotUiService.removeCandidateAtLastFoundPosition(candidate, this.ballotUiData);
    this.scrollToPosition(position);
    this.contentChanged.emit();
  }

  public removeCandidateRange({ start, end }: RemoveCandidateRangeData): void {
    this.ballotUiService.removeCandidatesInRange(start, end, this.ballotUiData);
    this.contentChanged.emit();
  }

  public async addCandidateAtPosition({ position, listCandidate, candidate }: AddCandidatePositionEvent): Promise<void> {
    if (!candidate) {
      const data: ProportionalElectionBallotCandidatesChooseDialogData = {
        candidates: Object.values(this.ballotUiData.addableCandidatesByNumber),
        candidateCheckDigit: this.electionResult.entryParams.candidateCheckDigit,
      };
      candidate = await this.dialogService.openForResult(ProportionalElectionBallotCandidatesChooseDialogComponent, data, {
        autoFocus: false,
      });

      if (!candidate) {
        return;
      }
    }

    this.ballotUiService.addCandidateAtPosition(candidate, position, listCandidate, this.ballotUiData);
    this.contentChanged.emit();
  }

  public addCandidate(candidate?: ProportionalElectionBallotCandidate): void {
    // the dropdown emits undefined values
    if (!candidate) {
      return;
    }

    const position = this.ballotUiService.addCandidateAtFirstAvailablePosition(candidate, this.ballotUiData);
    this.scrollToPosition(position);
    this.contentChanged.emit();
  }

  public updateEmptyVotes(emptyVoteCount: number): void {
    if (
      emptyVoteCount < 0 ||
      emptyVoteCount > this.ballotUiData.numberOfMandates ||
      emptyVoteCount === this.ballotUiData.userEnteredEmptyVoteCount
    ) {
      return;
    }

    this.ballotUiService.updateUserEnteredEmptyVoteCount(this.ballotUiData, emptyVoteCount);
    this.contentChanged.emit();
  }

  public setFocus(): void {
    this.proportionalElectionBallotCandidateModifyComponent?.setFocus(this.ballotUiData.listPositions.every(p => p.isSlotAvailable));
  }

  private scrollToPosition(position: number): void {
    const elementRef = this.proportionalElectionBallotCandidatesComponent?.positionElements.get(position - 1);
    elementRef?.nativeElement.scrollIntoView({ block: 'nearest' });
  }
}
