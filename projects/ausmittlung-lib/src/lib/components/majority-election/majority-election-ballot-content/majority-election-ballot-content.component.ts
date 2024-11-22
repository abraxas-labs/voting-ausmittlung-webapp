/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { TextComponent } from '@abraxas/base-components';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { MajorityElectionBallotCandidate, MajorityElectionResultBallotBase } from '../../../models';
import { groupBySingle } from '../../../services/utils/array.utils';

@Component({
  selector: 'vo-ausm-majority-election-ballot-content',
  templateUrl: './majority-election-ballot-content.component.html',
  styleUrls: ['./majority-election-ballot-content.component.scss'],
})
export class MajorityElectionBallotContentComponent implements OnChanges {
  @Input()
  public readonly: boolean = false;

  @Input()
  public disabled: boolean = false;

  @Input()
  public isSecondaryElection: boolean = false;

  @Input()
  public automaticEmptyVoteCounting: boolean = true;

  @Input()
  public showInvalidVotes: boolean = false;

  @Input()
  public showIndividualVotes: boolean = false;

  @Input()
  public showEmptyVotes: boolean = true;

  @Input()
  public ballot!: MajorityElectionResultBallotBase;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public contentCompleted: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

  @ViewChild('toggleCandidateInput')
  public toggleCandidateInput!: TextComponent;

  public toggleCandidateValue: string = '';

  private selectableCandidatesByNumber: Record<string, MajorityElectionBallotCandidate> = {};

  public ngOnChanges(): void {
    this.updateEmptyVoteCount();
    if (!this.readonly) {
      this.updateSelectableCandidates();
    }
  }

  @HostListener('document:keydown.control.alt.r', ['$event'])
  public focusToggleCandidate(event: KeyboardEvent): void {
    if (this.isSecondaryElection) {
      return;
    }

    event.preventDefault();
    this.toggleCandidateInput.setFocus();
  }

  public tryToggleCandidate(candidateNumber: string): void {
    this.toggleCandidate(this.selectableCandidatesByNumber[candidateNumber]);
  }

  public toggleCandidate(candidate?: MajorityElectionBallotCandidate): void {
    if (!candidate) {
      return;
    }

    candidate.selected = !candidate.selected;
    this.ballot.computedEmptyVoteCount += candidate.selected ? -1 : 1;
    this.setEmptyVoteCountIfAuto();
    this.updateSelectableCandidates();
    this.contentChanged.emit();

    // setTimeout is needed so that the value is set after the ngModel binding updates the value.
    setTimeout(() => (this.toggleCandidateValue = ''));
  }

  public updateEmptyVoteCount(): void {
    this.ballot.computedEmptyVoteCount =
      this.ballot.election.numberOfMandates -
      this.ballot.individualVoteCount -
      this.ballot.invalidVoteCount -
      this.ballot.candidates.filter(c => c.selected).length;
    this.setEmptyVoteCountIfAuto();
  }

  public updateManualEmptyVoteCount(emptyVoteCount: number): void {
    if (this.ballot.emptyVoteCount === emptyVoteCount) {
      return;
    }

    this.ballot.emptyVoteCount = emptyVoteCount;
    this.contentChanged.emit();
  }

  public setFocus(): void {
    this.toggleCandidateInput.setFocus();
  }

  public setInvalidVoteCount(count: number): void {
    if (this.ballot.invalidVoteCount === count) {
      return;
    }

    this.ballot.invalidVoteCount = count;
    this.updateEmptyVoteCount();
    this.contentChanged.emit();
  }

  public setIndividualVoteCount(count: number): void {
    if (this.ballot.individualVoteCount === count) {
      return;
    }

    this.ballot.individualVoteCount = count;
    this.updateEmptyVoteCount();
    this.contentChanged.emit();
  }

  private setEmptyVoteCountIfAuto(): void {
    if (this.automaticEmptyVoteCounting) {
      this.ballot.emptyVoteCount = this.ballot.computedEmptyVoteCount;
    }
  }

  private updateSelectableCandidates(): void {
    const candidates = this.ballot.computedEmptyVoteCount > 0 ? this.ballot.candidates : this.ballot.candidates.filter(c => c.selected);
    this.selectableCandidatesByNumber = groupBySingle(
      candidates,
      x => (this.candidateCheckDigit ? `${x.number}${x.checkDigit}` : x.number),
      x => x,
    );
  }
}
