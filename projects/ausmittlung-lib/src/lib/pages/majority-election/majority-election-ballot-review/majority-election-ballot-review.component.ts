/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BallotReviewStepperComponent } from '../../../components/ballot-review-stepper/ballot-review-stepper.component';
import {
  BallotReview,
  MajorityElectionBase,
  MajorityElectionResult,
  MajorityElectionResultBallot,
  PoliticalBusinessResultBundle,
  ReviewState,
} from '../../../models';
import { MajorityElectionResultBundleService } from '../../../services/majority-election-result-bundle.service';
import { PermissionService } from '../../../services/permission.service';
import { Permissions } from '../../../models/permissions.model';
import { isErrorType } from '../../../services/utils/error.utils';

const modifiedReviewForbiddenException = 'ReviewModifiedBundleForbiddenException';

@Component({
  selector: 'vo-ausm-majority-election-ballot-review',
  templateUrl: './majority-election-ballot-review.component.html',
  styleUrls: ['./majority-election-ballot-review.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotReviewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);
  private readonly i18n = inject(TranslateService);
  private readonly resultBundleService = inject(MajorityElectionResultBundleService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(SnackbarService);

  public loading: boolean = true;
  public loadingBallot: boolean = true;
  public actionExecuting: boolean = false;

  public bundle?: PoliticalBusinessResultBundle;
  public electionResult?: MajorityElectionResult;
  public ballot?: MajorityElectionResultBallot;

  public reviewBallots: BallotReview[] = [];

  public canSucceedSelfModifiedBundle: boolean = false;
  public canSucceed: boolean = false;
  public correctionOngoing: boolean = false;

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
    this.routeParamsSubscription = this.route.params.subscribe(({ bundleId }) => this.loadData(bundleId));
  }

  public async ngOnInit(): Promise<void> {
    this.canSucceedSelfModifiedBundle = await this.permissionService.hasPermission(
      Permissions.PoliticalBusinessResultBundle.ReviewSelfModifiedBundle,
    );
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  public updateState(): void {
    this.canSucceed = this.canSucceedSelfModifiedBundle
      ? this.reviewBallots.every(x => x.state !== ReviewState.NOT_REVIEWED)
      : this.reviewBallots.every(x => x.state === ReviewState.OK);
  }

  public async back(): Promise<void> {
    await this.router.navigate(['../../'], { relativeTo: this.route });
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
        state: ReviewState.NOT_REVIEWED,
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
