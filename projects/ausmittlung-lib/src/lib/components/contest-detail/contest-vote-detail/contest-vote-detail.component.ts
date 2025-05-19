/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isEqual } from 'lodash';
import {
  BallotQuestionResult,
  ContestCountingCircleDetails,
  TieBreakQuestionResult,
  updateCountOfVotersCalculatedFields,
  ValidationSummary,
  VoteResult,
  VoteResultEntry,
} from '../../../models';
import { PoliticalBusinessResultService } from '../../../services/political-business-result.service';
import { PermissionService } from '../../../services/permission.service';
import { SecondFactorTransactionService } from '../../../services/second-factor-transaction.service';
import { VoteResultService } from '../../../services/vote-result.service';
import { AbstractContestPoliticalBusinessDetailComponent } from '../contest-political-business-detail/contest-political-business-detail-base.component';
import { ContestPoliticalBusinessDetailComponent } from '../contest-political-business-detail/contest-political-business-detail.component';
import { ContestVoteDetailBallotComponent } from './contest-vote-detail-ballot/contest-vote-detail-ballot.component';
import { ContestVoteDetailDetailedComponent } from './contest-vote-detail-detailed/contest-vote-detail-detailed.component';
import { UnsavedChangesService } from '../../../services/unsaved-changes.service';
import { VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL } from '../../../tokens';

@Component({
  selector: 'vo-ausm-contest-vote-detail',
  templateUrl: './contest-vote-detail.component.html',
  standalone: false,
})
export class ContestVoteDetailComponent extends AbstractContestPoliticalBusinessDetailComponent<VoteResult, VoteResultService> {
  public readonly entryVariants: typeof VoteResultEntry = VoteResultEntry;

  public countOfVotersValid: boolean = true;

  @ViewChild(ContestVoteDetailBallotComponent)
  private contestVoteDetailBallotComponent?: ContestVoteDetailBallotComponent;

  @ViewChild(ContestVoteDetailDetailedComponent)
  private contestVoteDetailDetailedComponent?: ContestVoteDetailDetailedComponent;

  constructor(
    @Inject(VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL) votingAusmittlungMonitoringWebAppUrl: string,
    parent: ContestPoliticalBusinessDetailComponent,
    i18n: TranslateService,
    toast: SnackbarService,
    roleService: PermissionService,
    voteResultService: VoteResultService,
    dialog: DialogService,
    secondFactorTransactionService: SecondFactorTransactionService,
    politicalBusinessResultService: PoliticalBusinessResultService,
    cd: ChangeDetectorRef,
    themeService: ThemeService,
    unsavedChangesService: UnsavedChangesService,
  ) {
    super(
      votingAusmittlungMonitoringWebAppUrl,
      i18n,
      toast,
      voteResultService,
      dialog,
      secondFactorTransactionService,
      politicalBusinessResultService,
      cd,
      roleService,
      themeService,
      unsavedChangesService,
      parent,
    );
  }

  public get hasUnsavedChanges(): boolean {
    return !isEqual(this.resultDetail, this.lastSavedResultDetail);
  }

  public async save(): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    try {
      this.isActionExecuting = true;

      if (this.resultDetail.entry === VoteResultEntry.VOTE_RESULT_ENTRY_FINAL_RESULTS) {
        if (this.resultDetail.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION) {
          await this.resultService.enterCorrectionResults(this.resultDetail);
        } else {
          await this.resultService.enterResults(this.resultDetail);
        }
      } else {
        await this.resultService.enterCountOfVoters(this.resultDetail);
      }
      this.lastSavedResultDetail = cloneDeep(this.resultDetail);
      this.toast.success(this.i18n.instant('APP.SAVED'));
      this.unsavedChangesService.removeUnsavedChange(this.resultDetail.id);
    } finally {
      this.isActionExecuting = false;
    }
  }

  public async validateAndSave(): Promise<void> {
    try {
      this.isActionExecuting = true;

      const validationConfirm = await this.confirmValidationOverviewDialog(false);
      if (!validationConfirm) {
        return;
      }

      await this.save();
    } finally {
      this.isActionExecuting = false;
    }
  }

  public resetResults(): void {
    if (!this.resultDetail) {
      return;
    }

    const isDetailedEntry = this.resultDetail.entry === VoteResultEntry.VOTE_RESULT_ENTRY_DETAILED;

    for (const ballotResult of this.resultDetail.results) {
      ballotResult.conventionalCountOfDetailedEnteredBallots = 0;
      ballotResult.allBundlesReviewedOrDeleted = true;

      this.resetQuestionResults(ballotResult.questionResults, isDetailedEntry);
      this.resetQuestionResults(ballotResult.tieBreakQuestionResults, isDetailedEntry);
    }
  }

  public countingCircleDetailsUpdated(values: ContestCountingCircleDetails): void {
    super.countingCircleDetailsUpdated(values);

    if (!this.resultDetail) {
      return;
    }

    for (const ballotResult of this.resultDetail.results) {
      updateCountOfVotersCalculatedFields(ballotResult.countOfVoters, this.resultDetail.totalCountOfVoters);
    }
  }

  public updateCountOfVotersValid(): void {
    this.countOfVotersValid = !!this.resultDetail && this.resultDetail.results.every(r => this.areCountOfVotersValid(r.countOfVoters));
  }

  public setFocus(): void {
    // detect changes to make sure that all components are visible
    this.cd.detectChanges();

    this.contestVoteDetailBallotComponent?.setFocus();
    this.contestVoteDetailDetailedComponent?.setFocus();
  }

  protected async loadValidationSummary(): Promise<ValidationSummary> {
    if (this.resultDetail!.entry === VoteResultEntry.VOTE_RESULT_ENTRY_FINAL_RESULTS) {
      if (this.resultDetail!.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION) {
        return await this.resultService.validateEnterCorrectionResults(this.resultDetail!);
      } else {
        return await this.resultService.validateEnterResults(this.resultDetail!);
      }
    } else {
      return await this.resultService.validateEnterCountOfVoters(this.resultDetail!);
    }
  }

  private resetQuestionResults(questionResults: BallotQuestionResult[] | TieBreakQuestionResult[], isDetailedEntry: boolean): void {
    const conventionalDefaultValue = isDetailedEntry ? 0 : undefined;

    for (const questionResult of questionResults) {
      questionResult.conventionalSubTotal.totalCountOfAnswer1 = conventionalDefaultValue;
      questionResult.conventionalSubTotal.totalCountOfAnswer2 = conventionalDefaultValue;
      questionResult.conventionalSubTotal.totalCountOfAnswerUnspecified = conventionalDefaultValue;

      questionResult.totalCountOfAnswer1 =
        questionResult.eVotingSubTotal.totalCountOfAnswer1 + questionResult.eCountingSubTotal.totalCountOfAnswer1;
      questionResult.totalCountOfAnswer2 =
        questionResult.eVotingSubTotal.totalCountOfAnswer2 + questionResult.eCountingSubTotal.totalCountOfAnswer2;
      questionResult.totalCountOfAnswerUnspecified =
        questionResult.eVotingSubTotal.totalCountOfAnswerUnspecified + questionResult.eCountingSubTotal.totalCountOfAnswerUnspecified;
    }
  }
}
