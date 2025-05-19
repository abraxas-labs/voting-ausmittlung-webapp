/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  ContestCountingCircleDetails,
  MajorityElectionResult,
  MajorityElectionResultEntry,
  resetMajorityConventionalResults,
  updateCountOfVotersCalculatedFields,
  ValidationSummary,
} from '../../../models';
import { MajorityElectionResultService } from '../../../services/majority-election-result.service';
import { PoliticalBusinessResultService } from '../../../services/political-business-result.service';
import { PermissionService } from '../../../services/permission.service';
import { SecondFactorTransactionService } from '../../../services/second-factor-transaction.service';
import { AbstractContestPoliticalBusinessDetailComponent } from '../contest-political-business-detail/contest-political-business-detail-base.component';
import { ContestPoliticalBusinessDetailComponent } from '../contest-political-business-detail/contest-political-business-detail.component';
import { ContestMajorityElectionDetailDetailedComponent } from './contest-majority-election-detail-detailed/contest-majority-election-detail-detailed.component';
import { ContestMajorityElectionDetailFinalResultsComponent } from './contest-majority-election-detail-final-results/contest-majority-election-detail-final-results.component';
import { UnsavedChangesService } from '../../../services/unsaved-changes.service';
import { cloneDeep } from 'lodash';
import { VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL } from '../../../tokens';

@Component({
  selector: 'vo-ausm-contest-majority-election-detail',
  templateUrl: './contest-majority-election-detail.component.html',
  standalone: false,
})
export class ContestMajorityElectionDetailComponent extends AbstractContestPoliticalBusinessDetailComponent<
  MajorityElectionResult,
  MajorityElectionResultService
> {
  public readonly entryVariants: typeof MajorityElectionResultEntry = MajorityElectionResultEntry;

  public candidateResultsValid: boolean = true;
  public countOfVotersValid: boolean = true;

  @ViewChild(ContestMajorityElectionDetailDetailedComponent)
  private contestMajorityElectionDetailDetailedComponent?: ContestMajorityElectionDetailDetailedComponent;

  @ViewChild(ContestMajorityElectionDetailFinalResultsComponent)
  private contestMajorityElectionDetailFinalResultsComponent?: ContestMajorityElectionDetailFinalResultsComponent;

  constructor(
    @Inject(VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL) votingAusmittlungMonitoringWebAppUrl: string,
    parent: ContestPoliticalBusinessDetailComponent,
    i18n: TranslateService,
    toast: SnackbarService,
    permissionService: PermissionService,
    resultService: MajorityElectionResultService,
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
      resultService,
      dialog,
      secondFactorTransactionService,
      politicalBusinessResultService,
      cd,
      permissionService,
      themeService,
      unsavedChangesService,
      parent,
    );
  }

  public updateCandidateResultsValid(): void {
    this.candidateResultsValid =
      !!this.resultDetail &&
      (this.resultDetail.conventionalSubTotal.individualVoteCount ?? 0) >= 0 &&
      this.resultDetail.candidateResults.every(x => (x.conventionalVoteCount ?? 0) >= 0) &&
      this.resultDetail.secondaryMajorityElectionResults.every(
        x => (x.conventionalSubTotal.individualVoteCount ?? 0) >= 0 && x.candidateResults.every(y => (y.conventionalVoteCount ?? 0) >= 0),
      );
  }

  public updateCountOfVotersValid(): void {
    this.countOfVotersValid = !!this.resultDetail && this.areCountOfVotersValid(this.resultDetail.countOfVoters);
  }

  public async save(): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    try {
      this.isActionExecuting = true;

      if (this.resultDetail.entry === MajorityElectionResultEntry.MAJORITY_ELECTION_RESULT_ENTRY_FINAL_RESULTS) {
        await this.resultService.enterCandidateResults(this.resultDetail);
      } else {
        await this.resultService.enterCountOfVoters(this.resultDetail.id, this.resultDetail.countOfVoters);
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

    resetMajorityConventionalResults(this.resultDetail);
  }

  public countingCircleDetailsUpdated(values: ContestCountingCircleDetails): void {
    super.countingCircleDetailsUpdated(values);

    if (!this.resultDetail) {
      return;
    }

    updateCountOfVotersCalculatedFields(this.resultDetail.countOfVoters, this.resultDetail.totalCountOfVoters);
  }

  public setFocus(): void {
    // detect changes to make sure that all components are visible
    this.cd.detectChanges();

    this.contestMajorityElectionDetailDetailedComponent?.setFocus();
    this.contestMajorityElectionDetailFinalResultsComponent?.setFocus();
  }

  protected async loadValidationSummary(): Promise<ValidationSummary> {
    return this.resultDetail!.entry === MajorityElectionResultEntry.MAJORITY_ELECTION_RESULT_ENTRY_FINAL_RESULTS
      ? await this.resultService.validateEnterCandidateResults(this.resultDetail!)
      : await this.resultService.validateEnterCountOfVoters(this.resultDetail!.id, this.resultDetail!.countOfVoters);
  }
}
