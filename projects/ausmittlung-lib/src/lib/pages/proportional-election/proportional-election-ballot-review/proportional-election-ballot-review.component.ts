/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { BallotReviewStepperComponent } from '../../../components/ballot-review-stepper/ballot-review-stepper.component';
import {
  BallotBundleState,
  ProportionalElectionCandidate,
  ProportionalElectionResult,
  ProportionalElectionResultBallot,
  ReviewState,
} from '../../../models';
import {
  ProportionalElectionBallotUiData,
  ProportionalElectionBallotUiService,
} from '../../../services/proportional-election-ballot-ui.service';
import { ProportionalElectionResultBundleService } from '../../../services/proportional-election-result-bundle.service';
import { ProportionalElectionService } from '../../../services/proportional-election.service';
import { isErrorType } from '../../../services/utils/error.utils';
import { PoliticalBusinessBallotReviewComponent } from '../../political-business-ballot-review/political-business-ballot-review.component';

const modifiedReviewForbiddenException = 'ReviewModifiedBundleForbiddenException';

@Component({
  selector: 'vo-ausm-proportional-election-ballot-review',
  templateUrl: './proportional-election-ballot-review.component.html',
  styleUrls: ['./proportional-election-ballot-review.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotReviewComponent extends PoliticalBusinessBallotReviewComponent implements OnDestroy {
  private readonly dialog = inject(DialogService);
  private readonly electionService = inject(ProportionalElectionService);
  private readonly resultBundleService = inject(ProportionalElectionResultBundleService);
  private readonly ballotUiService = inject(ProportionalElectionBallotUiService);

  public electionResult?: ProportionalElectionResult;
  public ballot?: ProportionalElectionResultBallot;

  public ballotUiData: ProportionalElectionBallotUiData = ProportionalElectionBallotUiService.newEmptyUiData();

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
    if (!this.ballot || !this.bundle || !this.electionResult) {
      return;
    }

    if (!this.ballotUiData.emptyVoteCountValid) {
      await this.dialog.alert(
        this.i18n.instant('ELECTION.BALLOT_DETAIL.INVALID_EMPTY_VOTE_COUNT.TITLE'),
        this.i18n.instant('ELECTION.BALLOT_DETAIL.INVALID_EMPTY_VOTE_COUNT.MSG'),
      );
      return;
    }

    try {
      this.actionExecuting = true;
      await this.resultBundleService.updateBallot(this.bundle.id, this.ballot.number, this.ballotUiData);
      this.updateBundleModificationUsers();
      this.reviewStepper.setStateAndNavigate(ReviewState.FIXED);
      this.correctionOngoing = false;
    } finally {
      this.actionExecuting = false;
    }
  }

  public async startCorrection(): Promise<void> {
    if (!this.electionResult) {
      return;
    }

    try {
      this.actionExecuting = true;
      this.ballotUiData = this.ballotUiService.buildUiData(
        await this.getElectionCandidates(),
        this.electionResult.entryParams.automaticBallotNumberGeneration,
        this.electionResult.entryParams.automaticEmptyVoteCounting,
        this.electionResult.election.numberOfMandates,
        this.electionResult!.entryParams.candidateCheckDigit,
        this.ballot,
      );
      this.correctionOngoing = true;
    } finally {
      this.actionExecuting = false;
    }
  }

  public async cancelCorrection(): Promise<void> {
    if (!this.electionResult) {
      return;
    }

    this.ballotUiData = this.ballotUiService.buildUiData(
      [],
      this.electionResult.entryParams.automaticBallotNumberGeneration,
      this.electionResult.entryParams.automaticEmptyVoteCounting,
      this.electionResult.election.numberOfMandates,
      this.electionResult.entryParams.candidateCheckDigit,
      this.ballot,
    );
    this.correctionOngoing = false;
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

  public async rejectBundleReview(): Promise<void> {
    if (!this.bundle) {
      return;
    }

    this.actionExecuting = true;
    try {
      await this.resultBundleService.rejectBundleReview(this.bundle.id);
      this.bundle.state = BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION;
      await this.back();
    } finally {
      this.actionExecuting = false;
    }
  }

  public async loadBallot(nr: number): Promise<void> {
    if (!this.bundle || !this.electionResult) {
      return;
    }

    this.loadingBallot = true;
    try {
      this.ballot = await this.resultBundleService.getBallot(this.bundle.id, nr);
      this.ballotUiData = this.ballotUiService.buildUiData(
        [],
        this.electionResult.entryParams.automaticBallotNumberGeneration,
        this.electionResult.entryParams.automaticEmptyVoteCounting,
        this.electionResult.election.numberOfMandates,
        this.electionResult.entryParams.candidateCheckDigit,
        this.ballot,
      );
    } finally {
      this.loadingBallot = false;
    }
  }

  private async loadData(bundleId: string): Promise<void> {
    this.loading = true;
    try {
      const response = await this.resultBundleService.getBundle(bundleId);
      this.bundle = response.bundle;
      this.electionResult = response.electionResult;
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

  private getElectionCandidates(): Promise<ProportionalElectionCandidate[]> {
    // this call is cached by the service
    return this.electionService.listCandidates(this.electionResult!.election.id);
  }
}
