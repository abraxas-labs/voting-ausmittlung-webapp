/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { BallotReviewStepperComponent } from '../../../components/ballot-review-stepper/ballot-review-stepper.component';
import { BallotBundleState, BallotResult, ReviewState, VoteResult, VoteResultBallot } from '../../../models';
import { VoteResultBundleService } from '../../../services/vote-result-bundle.service';
import { isErrorType } from '../../../services/utils/error.utils';
import { PoliticalBusinessBallotReviewComponent } from '../../political-business-ballot-review/political-business-ballot-review.component';

const modifiedReviewForbiddenException = 'ReviewModifiedBundleForbiddenException';

@Component({
  selector: 'vo-ausm-vote-ballot-review',
  templateUrl: './vote-ballot-review.component.html',
  styleUrls: ['./vote-ballot-review.component.scss'],
  standalone: false,
})
export class VoteBallotReviewComponent extends PoliticalBusinessBallotReviewComponent implements OnDestroy {
  private readonly resultBundleService = inject(VoteResultBundleService);

  public voteResult?: VoteResult;
  public ballot?: VoteResultBallot;
  public ballotResult?: BallotResult;

  @ViewChild(BallotReviewStepperComponent)
  public reviewStepper!: BallotReviewStepperComponent;

  private readonly routeParamsSubscription: Subscription;

  constructor() {
    super();
    this.routeParamsSubscription = this.route.params.subscribe(({ bundleId }) => this.loadData(bundleId));
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  public async submitCorrection(): Promise<void> {
    if (!this.ballot || !this.bundle || !this.voteResult) {
      return;
    }

    try {
      this.actionExecuting = true;
      await this.resultBundleService.updateBallot(this.bundle.id, this.ballot);
      this.updateBundleModificationUsers();
      this.reviewStepper.setStateAndNavigate(ReviewState.FIXED);
      this.correctionOngoing = false;
    } finally {
      this.actionExecuting = false;
    }
  }

  public async startCorrection(): Promise<void> {
    if (!this.ballot) {
      return;
    }

    this.correctionOngoing = true;
  }

  public async cancelCorrection(): Promise<void> {
    if (!this.ballot) {
      return;
    }

    this.correctionOngoing = false;
    await this.loadBallot(this.ballot.number);
  }

  public async succeedBundleReview(): Promise<void> {
    if (!this.bundle) {
      return;
    }

    this.actionExecuting = true;
    try {
      await this.resultBundleService.succeedBundleReview([this.bundle.id]);
      this.bundle.state = BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED;
      await this.back();
    } finally {
      this.actionExecuting = false;
    }
  }

  public async rejectBundleReview(): Promise<void> {
    if (!this.bundle) {
      return;
    }

    this.actionExecuting = true;
    try {
      await this.resultBundleService.rejectBundleReview(this.bundle.id);
      this.bundle.state = BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION;
      await this.back();
    } catch (e: any) {
      if (isErrorType(e, modifiedReviewForbiddenException)) {
        this.toast.error(this.i18n.instant('POLITICAL_BUSINESS.CANNOT_REVIEW_MODIFIED_BUNDLE'));
      } else {
        throw e;
      }
    } finally {
      this.actionExecuting = false;
    }
  }

  public async loadBallot(nr: number): Promise<void> {
    if (!this.bundle || !this.voteResult) {
      return;
    }

    this.loadingBallot = true;
    try {
      this.ballot = await this.resultBundleService.getBallot(this.bundle.id, nr);
    } finally {
      this.loadingBallot = false;
    }
  }

  private async loadData(bundleId: string): Promise<void> {
    this.loading = true;
    try {
      const response = await this.resultBundleService.getBundle(bundleId);
      this.bundle = response.bundle;
      this.voteResult = response.politicalBusinessResult;
      this.ballotResult = response.ballotResult;
      this.reviewBallots = this.bundle.ballotNumbersToReview.map(ballotNumber => ({
        ballotNumber,
        state: response.bundle.ballotNumbersModifiedDuringReview.includes(ballotNumber) ? ReviewState.FIXED : ReviewState.NOT_REVIEWED,
      }));
      if (this.reviewBallots.length > 0) {
        await this.loadBallot(this.bundle.ballotNumbersToReview[0]);
      } else {
        delete this.ballot;
      }
    } finally {
      this.loading = false;
      this.loadingBallot = false;
    }
  }
}
