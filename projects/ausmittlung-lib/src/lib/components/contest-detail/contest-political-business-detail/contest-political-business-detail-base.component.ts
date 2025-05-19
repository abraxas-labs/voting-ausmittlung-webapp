/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Directive, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  ContestCantonDefaults,
  ContestCountingCircleDetails,
  CountingCircleResult,
  CountingCircleResultState,
  PoliticalBusinessNullableCountOfVoters,
  ResultListResult,
  StateChange,
  ValidationSummary,
} from '../../../models';
import { PoliticalBusinessResultBaseService } from '../../../services/political-business-result-base.service';
import { PoliticalBusinessResultService } from '../../../services/political-business-result.service';
import { PermissionService } from '../../../services/permission.service';
import { SecondFactorTransactionService } from '../../../services/second-factor-transaction.service';
import { sum } from '../../../services/utils/array.utils';
import {
  ValidationOverviewDialogComponent,
  ValidationOverviewDialogData,
  ValidationOverviewDialogResult,
} from '../../validation-overview-dialog/validation-overview-dialog.component';
import { ContestPoliticalBusinessDetailComponent } from './contest-political-business-detail.component';
import { Permissions } from '../../../models/permissions.model';
import { VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL } from '../../../tokens';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { UnsavedChangesService } from '../../../services/unsaved-changes.service';
import { cloneDeep, isEqual } from 'lodash';

@Directive()
export abstract class AbstractContestPoliticalBusinessDetailComponent<
    T extends CountingCircleResult,
    TService extends PoliticalBusinessResultBaseService<T, any, any>,
  >
  implements OnInit, OnDestroy
{
  private static readonly emptySecondFactorId: string = '';

  @Input()
  public countingCircleId!: string;

  @Input()
  public result!: ResultListResult;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  @Input()
  public contestCountingCircleDetails!: ContestCountingCircleDetails;

  @Input()
  public contentReadonly: boolean = true;

  @Input()
  public contestLocked: boolean = true;

  @Input()
  public isResponsibleMonitorAuthority: boolean = false;

  @Input()
  public contestCantonDefaults?: ContestCantonDefaults;

  public resultDetail?: T;
  public lastSavedResultDetail?: T;
  public canEnterResults: boolean = false;
  public canFinishSubmission: boolean = false;
  public canAudit: boolean = false;
  public canFinishSubmissionAndAudit: boolean = false;

  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;

  public resultReadonly: boolean = true;
  public selectResultEntry: boolean = false;
  public isActionExecuting: boolean = false;
  public loading: boolean = true;
  public isDataLoaded: boolean = false;

  private readonly parentExpandedSubscription?: Subscription;
  private readonly parentCountingCircleDetailsUpdatedSubscription?: Subscription;
  private readonly stateChangeSubscription?: Subscription;

  protected constructor(
    @Inject(VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL) public readonly votingAusmittlungMonitoringWebAppUrl: string,
    protected readonly i18n: TranslateService,
    protected readonly toast: SnackbarService,
    protected readonly resultService: TService,
    protected readonly dialog: DialogService,
    protected readonly secondFactorTransactionService: SecondFactorTransactionService,
    protected readonly politicalBusinessResultService: PoliticalBusinessResultService,
    protected readonly cd: ChangeDetectorRef,
    protected readonly permissionService: PermissionService,
    protected readonly themeService: ThemeService,
    protected readonly unsavedChangesService: UnsavedChangesService,
    private readonly parent: ContestPoliticalBusinessDetailComponent,
  ) {
    this.parentExpandedSubscription = parent.expanded$.pipe(filter(x => x)).subscribe(() => this.expanded());

    this.parentCountingCircleDetailsUpdatedSubscription = parent.countingCircleDetailsUpdated$.subscribe(details =>
      this.countingCircleDetailsUpdated(details),
    );

    this.stateChangeSubscription = this.politicalBusinessResultService.resultStateChanged$
      .pipe(filter(({ resultId }) => this.result.id === resultId))
      .subscribe(state => this.resultStateUpdated(state.newState));
  }

  public async ngOnInit(): Promise<void> {
    this.setResultReadonly();
    this.canEnterResults = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.EnterResults);
    this.canFinishSubmission = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.FinishSubmission);
    this.canAudit = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.Audit);
    this.canFinishSubmissionAndAudit = await this.permissionService.hasPermission(
      Permissions.PoliticalBusinessResult.FinishSubmissionAndAudit,
    );
  }

  public ngOnDestroy(): void {
    this.parentExpandedSubscription?.unsubscribe();
    this.parentCountingCircleDetailsUpdatedSubscription?.unsubscribe();
    this.stateChangeSubscription?.unsubscribe();
  }

  public countingCircleDetailsUpdated(values: ContestCountingCircleDetails): void {
    if (!this.resultDetail) {
      return;
    }

    this.resultDetail.totalCountOfVoters = sum(
      values.countOfVotersInformation.subTotalInfoList.filter(x =>
        this.resultDetail!.politicalBusiness.enabledVoterTypesList.includes(x.voterType),
      ),
      x => x.countOfVoters,
    );
  }

  public updateUnsavedChanges(): void {
    if (!this.resultDetail) {
      return;
    }

    if (this.hasUnsavedChanges) {
      this.unsavedChangesService.addUnsavedChange(this.resultDetail.id);
      return;
    }

    this.unsavedChangesService.removeUnsavedChange(this.resultDetail.id);
  }

  public async stateUpdate(event: StateChange): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    try {
      this.isActionExecuting = true;

      const isAuditedTentativelyForSelfOwnedBusinesses =
        (event.oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING ||
          event.oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION) &&
        event.newState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY;

      if (
        (event.oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION &&
          event.newState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE) ||
        (event.oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING &&
          event.newState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE) ||
        isAuditedTentativelyForSelfOwnedBusinesses
      ) {
        const validationConfirm = await this.confirmValidationOverviewDialog(true, isAuditedTentativelyForSelfOwnedBusinesses);
        if (!validationConfirm) {
          return;
        }
      }

      await this.executeStateUpdate(this.resultDetail, event);
      this.lastSavedResultDetail!.state = event.newState;
      this.toast.success(this.i18n.instant('APP.SAVED'));
      this.result.state = this.resultDetail.state = event.newState;

      switch (this.result.state) {
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING:
          this.result.submissionDoneTimestamp = undefined;
          break;
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION:
          this.result.submissionDoneTimestamp = undefined;
          this.result.readyForCorrectionTimestamp = new Date();
          break;
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE:
          this.result.submissionDoneTimestamp = new Date();
          break;
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE:
          this.result.submissionDoneTimestamp = new Date();
          this.result.readyForCorrectionTimestamp = undefined;
          break;
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY:
          this.result.auditedTentativelyTimestamp = new Date();
          break;
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED:
          this.result.plausibilisedTimestamp = new Date();
          break;
      }

      this.politicalBusinessResultService.resultStateChanged(this.resultDetail.id, event.newState, event.comment);
    } finally {
      this.isActionExecuting = false;
    }
  }

  public get hasUnsavedChanges(): boolean {
    return !isEqual(this.resultDetail, this.lastSavedResultDetail);
  }

  protected abstract loadValidationSummary(): Promise<ValidationSummary>;

  protected async confirmValidationOverviewDialog(
    isFinishingOperation: boolean,
    isAuditedTentativelyForSelfOwnedBusinesses: boolean = false,
  ): Promise<boolean> {
    const validationSummary = await this.loadValidationSummary();

    const data: ValidationOverviewDialogData = {
      validationSummaries: [validationSummary],
      canEmitSave: !(isFinishingOperation && !validationSummary.isValid),
      header: `VALIDATION.${validationSummary.isValid ? 'VALID' : 'INVALID'}`,
      saveLabel:
        isAuditedTentativelyForSelfOwnedBusinesses && validationSummary.isValid
          ? 'ACTIONS.SUBMIT_RESULTS_AND_AUDIT_TENTATIVELY.TITLE'
          : isFinishingOperation && !validationSummary.isValid
            ? 'APP.CONTINUE'
            : 'COMMON.SAVE',
      saveIcon: isAuditedTentativelyForSelfOwnedBusinesses && validationSummary.isValid ? 'external-link' : undefined,
      hintLabel:
        isAuditedTentativelyForSelfOwnedBusinesses && validationSummary.isValid
          ? 'ACTIONS.SUBMIT_RESULTS_AND_AUDIT_TENTATIVELY.HINT'
          : undefined,
      hasSaveButton: isFinishingOperation || this.hasUnsavedChanges,
    };

    const result = await this.dialog.openForResult<ValidationOverviewDialogComponent, ValidationOverviewDialogResult>(
      ValidationOverviewDialogComponent,
      data,
    );

    return !!result && result.save;
  }

  protected async executeStateUpdate({ id }: T, { oldState, newState, comment }: StateChange): Promise<void> {
    switch (newState) {
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE: {
        if (oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY) {
          await this.resultService.resetToSubmissionFinished(id);
          break;
        }

        const secondFactorTransaction = await this.resultService.prepareSubmissionFinished(id);
        if (!secondFactorTransaction.getId() || !secondFactorTransaction.getCode()) {
          await firstValueFrom(
            this.resultService.submissionFinished(id, AbstractContestPoliticalBusinessDetailComponent.emptySecondFactorId),
          );
          break;
        }

        await this.secondFactorTransactionService.showDialogAndExecuteVerifyAction(
          () => this.resultService.submissionFinished(id, secondFactorTransaction.getId()),
          secondFactorTransaction.getCode(),
          secondFactorTransaction.getQrCode(),
        );
        break;
      }
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION: {
        if (oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY) {
          await this.resultService.resetToSubmissionFinishedAndFlagForCorrection(id);
          break;
        }

        await this.resultService.flagForCorrection(id, comment);
        break;
      }
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE: {
        const secondFactorTransaction = await this.resultService.prepareCorrectionFinished(id);
        if (!secondFactorTransaction.getId() || !secondFactorTransaction.getCode()) {
          await firstValueFrom(
            this.resultService.correctionFinished(id, comment, AbstractContestPoliticalBusinessDetailComponent.emptySecondFactorId),
          );
          break;
        }

        await this.secondFactorTransactionService.showDialogAndExecuteVerifyAction(
          () => this.resultService.correctionFinished(id, comment, secondFactorTransaction.getId()),
          secondFactorTransaction.getCode(),
          secondFactorTransaction.getQrCode(),
        );
        break;
      }
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY: {
        if (oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED) {
          await this.resultService.resetToAuditedTentatively([id]);
          break;
        }

        if (oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING) {
          await this.resultService.submissionFinishedAndAuditedTentatively(id);
          this.openMonitoring();
          break;
        }

        if (oldState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION) {
          await this.resultService.correctionFinishedAndAuditedTentatively(id);
          this.openMonitoring();
          break;
        }

        await this.resultService.auditedTentatively([id]);
        break;
      }
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED: {
        await this.resultService.plausibilise([id]);
        break;
      }
    }
  }

  protected async loadData(): Promise<T> {
    const detailedResult = await this.resultService.get(this.result.politicalBusiness.id, this.countingCircleId);
    this.lastSavedResultDetail = cloneDeep(detailedResult);
    return detailedResult;
  }

  protected areCountOfVotersValid(countOfVoters: PoliticalBusinessNullableCountOfVoters): boolean {
    return (
      (countOfVoters.conventionalSubTotal.receivedBallots ?? 0) >= 0 &&
      (countOfVoters.conventionalSubTotal.accountedBallots ?? 0) >= 0 &&
      (countOfVoters.conventionalSubTotal.invalidBallots ?? 0) >= 0 &&
      (countOfVoters.conventionalSubTotal.blankBallots ?? 0) >= 0
    );
  }

  protected abstract setFocus(): void;

  private async expanded(): Promise<void> {
    if (!this.isDataLoaded) {
      try {
        this.loading = true;
        this.resultDetail = await this.loadData();
      } finally {
        this.loading = false;
        this.isDataLoaded = true;
      }
    }

    this.setFocus();
  }

  private setResultReadonly(): void {
    this.resultReadonly =
      this.contestLocked ||
      this.contentReadonly ||
      (this.result.state !== this.states.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING &&
        this.result.state !== this.states.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION);
  }

  private resultStateUpdated(newState: CountingCircleResultState): void {
    this.setResultReadonly();

    if (this.resultDetail) {
      this.resultDetail.state = newState;
    }

    if (newState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING) {
      if (this.parent.expanded) {
        this.parent.expanded = false;
      }

      delete this.resultDetail;
      this.isDataLoaded = false;
    }
  }

  private getPoliticalBusinessTypeUrl(politicalBusinessType?: PoliticalBusinessType): string {
    switch (politicalBusinessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        return 'vote-end-results';
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION:
        return 'majority-election-end-results';
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        return 'proportional-election-end-results';
      default:
        throw new Error('invalid political business type');
    }
  }

  private openMonitoring(): void {
    const politicalBusinessTypeUrl = this.getPoliticalBusinessTypeUrl(this.resultDetail?.politicalBusiness.politicalBusinessType);
    const url =
      `${this.votingAusmittlungMonitoringWebAppUrl}/${this.themeService.theme$.value}/` +
      (this.contestCantonDefaults?.endResultFinalizeDisabled
        ? `contests/${this.resultDetail?.politicalBusiness.contestId}/exports`
        : `${politicalBusinessTypeUrl}/${this.resultDetail?.politicalBusinessId}`);
    window.open(url, '_blank');
  }
}
