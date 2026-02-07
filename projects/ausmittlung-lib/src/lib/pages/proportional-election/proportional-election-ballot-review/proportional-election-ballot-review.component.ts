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
  ProportionalElectionCandidate,
  ProportionalElectionResult,
  ProportionalElectionResultBallot,
  ProportionalElectionResultBundle,
  ReviewState,
} from '../../../models';
import {
  ProportionalElectionBallotUiData,
  ProportionalElectionBallotUiService,
} from '../../../services/proportional-election-ballot-ui.service';
import { ProportionalElectionResultBundleService } from '../../../services/proportional-election-result-bundle.service';
import { ProportionalElectionService } from '../../../services/proportional-election.service';
import { Permissions } from '../../../models/permissions.model';
import { PermissionService } from '../../../services/permission.service';
import { isErrorType } from '../../../services/utils/error.utils';

const modifiedReviewForbiddenException = 'ReviewModifiedBundleForbiddenException';

@Component({
  selector: 'vo-ausm-proportional-election-ballot-review',
  templateUrl: './proportional-election-ballot-review.component.html',
  styleUrls: ['./proportional-election-ballot-review.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotReviewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);
  private readonly i18n = inject(TranslateService);
  private readonly electionService = inject(ProportionalElectionService);
  private readonly resultBundleService = inject(ProportionalElectionResultBundleService);
  private readonly ballotUiService = inject(ProportionalElectionBallotUiService);
  private readonly toast = inject(SnackbarService);
  private readonly permissionService = inject(PermissionService);

  public loading: boolean = true;
  public loadingBallot: boolean = true;
  public actionExecuting: boolean = false;

  public bundle?: ProportionalElectionResultBundle;
  public electionResult?: ProportionalElectionResult;
  public ballot?: ProportionalElectionResultBallot;

  public reviewBallots: BallotReview[] = [];
  public ballotUiData: ProportionalElectionBallotUiData = ProportionalElectionBallotUiService.newEmptyUiData();

  public canSucceedSelfModifiedBundle: boolean = false;
  public canSucceed: boolean = false;
  public correctionOngoing: boolean = false;

  @ViewChild(BallotReviewStepperComponent)
  public reviewStepper!: BallotReviewStepperComponent;

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

  private getElectionCandidates(): Promise<ProportionalElectionCandidate[]> {
    // this call is cached by the service
    return this.electionService.listCandidates(this.electionResult!.election.id);
  }
}
