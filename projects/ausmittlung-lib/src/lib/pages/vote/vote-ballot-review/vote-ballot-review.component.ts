/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BallotReviewStepperComponent } from '../../../components/ballot-review-stepper/ballot-review-stepper.component';
import { BallotResult, BallotReview, PoliticalBusinessResultBundle, ReviewState, VoteResult, VoteResultBallot } from '../../../models';
import { VoteResultBundleService } from '../../../services/vote-result-bundle.service';

@Component({
  selector: 'vo-ausm-vote-ballot-review',
  templateUrl: './vote-ballot-review.component.html',
  styleUrls: ['./vote-ballot-review.component.scss'],
  standalone: false,
})
export class VoteBallotReviewComponent implements OnDestroy {
  public loading: boolean = true;
  public loadingBallot: boolean = true;
  public actionExecuting: boolean = false;

  public bundle?: PoliticalBusinessResultBundle;
  public voteResult?: VoteResult;
  public ballot?: VoteResultBallot;
  public ballotResult?: BallotResult;

  public reviewBallots: BallotReview[] = [];

  public canSucceed: boolean = false;
  public correctionOngoing: boolean = false;

  @ViewChild(BallotReviewStepperComponent)
  public reviewStepper!: BallotReviewStepperComponent;

  private readonly routeParamsSubscription: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly resultBundleService: VoteResultBundleService,
  ) {
    this.routeParamsSubscription = this.route.params.subscribe(({ bundleId }) => this.loadData(bundleId));
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  public updateState(): void {
    this.canSucceed = this.reviewBallots.every(x => x.state !== ReviewState.NOT_REVIEWED);
  }

  public async back(): Promise<void> {
    await this.router.navigate(['../../'], { relativeTo: this.route });
  }

  public async submitCorrection(): Promise<void> {
    if (!this.ballot || !this.bundle || !this.voteResult) {
      return;
    }

    try {
      this.actionExecuting = true;
      await this.resultBundleService.updateBallot(this.bundle.id, this.ballot);
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
      await this.back();
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
        state: ReviewState.NOT_REVIEWED,
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
