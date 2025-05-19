/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { STEPPER_GLOBAL_OPTIONS, StepperOptions } from '@angular/cdk/stepper';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { BallotReview, ReviewState } from '../../models';

const stepperOptions: StepperOptions = {
  showError: true,
};

@Component({
  selector: 'vo-ausm-ballot-review-stepper',
  templateUrl: './ballot-review-stepper.component.html',
  styleUrls: ['./ballot-review-stepper.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: stepperOptions,
    },
  ],
  standalone: false,
})
export class BallotReviewStepperComponent {
  public readonly reviewStates: typeof ReviewState = ReviewState;

  public reviewBallotsValue: BallotReview[] = [];

  @ViewChild(MatStepper, { static: true })
  public stepper!: MatStepper;

  @Input()
  public ballotTitle: string = '';

  @Input()
  public correctionOngoing: boolean = false;

  @Output()
  public startCorrection: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public cancelCorrection: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public submitCorrection: EventEmitter<void> = new EventEmitter<void>();

  @Input()
  public disabled: boolean = true;

  @Input()
  public labelSamplesDescription: string = 'ELECTION.REVIEW_BALLOT_DETAIL.SAMPLES.DESCRIPTION';

  @Output()
  public ballotNumberSelected: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  public reviewBallotChange: EventEmitter<BallotReview> = new EventEmitter<BallotReview>();

  private selectedBallot?: BallotReview;

  @Input()
  public set reviewBallots(ballots: BallotReview[]) {
    this.reviewBallotsValue = ballots;
    this.selectedBallot = ballots[0];
  }

  public setStateAndNavigate(state: ReviewState): void {
    if (!this.selectedBallot) {
      return;
    }

    const ballotIndex = this.reviewBallotsValue.indexOf(this.selectedBallot);
    this.selectedBallot.state = state;
    this.reviewBallotChange.emit(this.selectedBallot);

    this.navigateToNextIfNeeded(ballotIndex);
  }

  public selectionChanged(selectedIndex: number): void {
    const ballot = this.reviewBallotsValue[selectedIndex];
    this.selectedBallot = ballot;
    this.ballotNumberSelected.emit(ballot.ballotNumber);
  }

  private navigateToNextIfNeeded(selectedIndex: number): void {
    const nextIndex = this.getNextIndex(selectedIndex);
    if (nextIndex !== undefined && nextIndex !== selectedIndex) {
      this.stepper.selectedIndex = nextIndex;
    }
  }

  private getNextIndex(selectedIndex: number): number | undefined {
    // navigate to next not yet reviewed ballot
    // if all are fixed or ok, navigate to the next fixed
    let nextIndex = this.getNextIndexByState(selectedIndex + 1, ReviewState.NOT_REVIEWED);
    if (nextIndex !== undefined) {
      return nextIndex;
    }

    nextIndex = this.getNextIndexByState(0, ReviewState.NOT_REVIEWED);
    if (nextIndex !== undefined) {
      return nextIndex;
    }

    nextIndex = this.getNextIndexByState(selectedIndex + 1, ReviewState.FIXED);
    if (nextIndex !== undefined) {
      return nextIndex;
    }

    nextIndex = this.getNextIndexByState(0, ReviewState.FIXED);
    if (nextIndex !== undefined) {
      return nextIndex;
    }
  }

  private getNextIndexByState(startIndex: number, state: ReviewState): number | undefined {
    const newIndex = this.reviewBallotsValue.slice(startIndex).findIndex(x => x.state === state);
    if (newIndex === -1) {
      return undefined;
    }

    return newIndex + startIndex;
  }
}
