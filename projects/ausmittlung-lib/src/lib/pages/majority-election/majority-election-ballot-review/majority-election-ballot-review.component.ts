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
  MajorityElectionBase,
  MajorityElectionResult,
  MajorityElectionResultBallot,
  ReviewState,
} from '../../../models';
import { MajorityElectionResultBundleService } from '../../../services/majority-election-result-bundle.service';
import { isErrorType } from '../../../services/utils/error.utils';
import { PoliticalBusinessBallotReviewComponent } from '../../political-business-ballot-review/political-business-ballot-review.component';

const modifiedReviewForbiddenException = 'ReviewModifiedBundleForbiddenException';

@Component({
  selector: 'vo-ausm-majority-election-ballot-review',
  templateUrl: './majority-election-ballot-review.component.html',
  styleUrls: ['./majority-election-ballot-review.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotReviewComponent extends PoliticalBusinessBallotReviewComponent implements OnDestroy {
  private readonly dialog = inject(DialogService);
  private readonly resultBundleService = inject(MajorityElectionResultBundleService);

  public electionResult?: MajorityElectionResult;
  public ballot?: MajorityElectionResultBallot;

  @ViewChild(BallotReviewStepperComponent)
  public reviewStepper!: BallotReviewStepperComponent;

  private selectedCandidateStatesBeforeEdit?: boolean[];
  private secondarySelectedCandidateStatesBeforeEdit?: boolean[][];

  private electionByIds?: {
    primaryElection: MajorityElectionBase;
    [id: string]: MajorityElectionBase;
  };

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

    if (!this.resultBundleService.hasValidEmptyVoteCount(this.ballot)) {
      await this.dialog.alert(
        this.i18n.instant('ELECTION.BALLOT_DETAIL.INVALID_EMPTY_VOTE_COUNT.TITLE'),
        this.i18n.instant('ELECTION.BALLOT_DETAIL.INVALID_EMPTY_VOTE_COUNT.MSG'),
      );
      return;
    }

    try {
      this.actionExecuting = true;
      await this.resultBundleService.updateBallot(this.bundle.id, this.ballot, this.electionResult.entryParams!.automaticEmptyVoteCounting);
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

    try {
      this.actionExecuting = true;
      this.selectedCandidateStatesBeforeEdit = this.ballot.candidates.map(x => x.selected);
      this.secondarySelectedCandidateStatesBeforeEdit = this.ballot.secondaryMajorityElectionBallots.map(x =>
        x.candidates.map(y => y.selected),
      );
      this.correctionOngoing = true;
    } finally {
      this.actionExecuting = false;
    }
  }

  public async cancelCorrection(): Promise<void> {
    if (!this.ballot || !this.selectedCandidateStatesBeforeEdit) {
      return;
    }

    let i = 0;
    for (const candidate of this.ballot.candidates) {
      candidate.selected = this.selectedCandidateStatesBeforeEdit[i++];
    }

    if (!this.ballot.secondaryMajorityElectionBallots || !this.secondarySelectedCandidateStatesBeforeEdit) {
      this.correctionOngoing = false;
      return;
    }

    i = 0;
    for (const secondaryElection of this.ballot.secondaryMajorityElectionBallots) {
      const candidateStates = this.secondarySelectedCandidateStatesBeforeEdit[i++];
      let j = 0;
      for (const candidate of secondaryElection.candidates) {
        candidate.selected = candidateStates[j++];
      }
    }

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
    if (!this.bundle || !this.electionResult || !this.electionByIds) {
      return;
    }

    this.loadingBallot = true;
    try {
      this.ballot = await this.resultBundleService.getBallot(this.bundle.id, nr, this.electionByIds);
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
      this.buildElectionData(this.electionResult);
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

  private buildElectionData(electionResult: MajorityElectionResult): void {
    this.electionByIds = {
      primaryElection: electionResult.election,
    };

    for (const secondaryElectionResult of electionResult.secondaryMajorityElectionResults) {
      this.electionByIds[secondaryElectionResult.election.id] = secondaryElectionResult.election;
    }
  }
}
