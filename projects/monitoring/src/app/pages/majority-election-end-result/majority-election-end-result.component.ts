/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  groupBySingle,
  MajorityElectionCandidateEndResult,
  MajorityElectionEndResult,
  MajorityElectionEndResultLotDecision,
  MajorityElectionResultService,
  SecondFactorTransactionService,
  MajorityElectionEndResultEventTypes,
  EventLogService,
} from 'ausmittlung-lib';
import { combineLatest, debounce, debounceTime, map, Subscription } from 'rxjs';
import {
  MajorityElectionLotDecisionDialogComponent,
  MajorityElectionLotDecisionDialogData,
  MajorityElectionLotDecisionDialogResult,
} from '../../components/majority-election-lot-decision-dialog/majority-election-lot-decision-dialog.component';
import { EndResultStep } from '../../models/end-result-step.model';

@Component({
  selector: 'app-majority-election-end-result',
  templateUrl: './majority-election-end-result.component.html',
  styleUrls: ['./majority-election-end-result.component.scss'],
  standalone: false,
})
export class MajorityElectionEndResultComponent implements OnDestroy {
  public loading: boolean = true;
  public stepActionLoading: boolean = false;
  public endResult?: MajorityElectionEndResult;
  public hasLotDecisions: boolean = false;
  public hasOpenRequiredLotDecisions: boolean = false;
  public isPartialResult = false;
  public majorityElectionId = '';
  public endResultStep?: EndResultStep;
  public finalizeEnabled = false;
  public lotDecisionProcessing = false;

  private readonly routeSubscription: Subscription;
  private watchSubscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: MajorityElectionResultService,
    private readonly dialogService: DialogService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly secondFactorTransactionService: SecondFactorTransactionService,
    private readonly eventLogService: EventLogService,
  ) {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(([params, queryParams]) => ({ politicalBusinessId: params.politicalBusinessId, isPartialResult: queryParams.partialResult })),
      )
      .subscribe(async ({ politicalBusinessId, isPartialResult }) => {
        this.isPartialResult = isPartialResult;
        this.majorityElectionId = politicalBusinessId;

        this.watchSubscription?.unsubscribe();
        delete this.watchSubscription;

        await this.loadData();

        this.watchSubscription = this.eventLogService
          .watch([...MajorityElectionEndResultEventTypes], {
            contestId: this.endResult!.contest.id,
            politicalBusinessId: this.majorityElectionId,
          })
          .pipe(debounceTime(1000)) // refresh once a second at max
          .subscribe(e => {
            this.loadData(false);

            if (
              e.type === 'MajorityElectionEndResultLotDecisionsUpdated' ||
              e.type === 'MajorityElectionEndResultSecondaryLotDecisionsUpdated'
            ) {
              this.lotDecisionProcessing = false;
            }
          });
      });
  }

  public async ngOnDestroy(): Promise<void> {
    this.routeSubscription.unsubscribe();
    this.watchSubscription?.unsubscribe();
  }

  public async handleEndResultStepChange(newStep: EndResultStep): Promise<void> {
    if (!this.endResultStep || !this.endResult) {
      return;
    }

    try {
      this.stepActionLoading = true;

      if (newStep === EndResultStep.AllCountingCirclesDone) {
        await this.setFinalized(false);
      }

      if (newStep === EndResultStep.Finalized) {
        await this.setFinalized(true);
      }

      this.endResultStep = newStep;
    } finally {
      this.stepActionLoading = false;
    }
  }

  public async setFinalized(finalize: boolean): Promise<void> {
    if (!this.endResult || finalize === this.endResult.finalized) {
      return;
    }

    if (finalize) {
      this.endResult.finalized = true;

      const confirmed = await this.dialogService.confirm(
        'END_RESULT.MAJORITY_ELECTION.CONFIRM.TITLE',
        'END_RESULT.MAJORITY_ELECTION.CONFIRM.MESSAGE',
        'APP.CONFIRM',
      );
      if (!confirmed) {
        this.endResult!.finalized = false;
        return;
      }

      const majorityElectionId = this.endResult.election.id;
      const secondFactorTransaction = await this.resultService.prepareFinalizeEndResult(majorityElectionId);

      await this.secondFactorTransactionService
        .showDialogAndExecuteVerifyAction(
          () => this.resultService.finalizeEndResult(majorityElectionId, secondFactorTransaction.getId()),
          secondFactorTransaction.getCode(),
          secondFactorTransaction.getQrCode(),
        )
        .catch(err => {
          this.endResult!.finalized = false;
          throw err;
        });
    } else {
      await this.resultService.revertEndResultFinalization(this.endResult.election.id);
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
    this.endResult.finalized = finalize;
  }

  public async openUpdateLotDecisions(): Promise<void> {
    if (!this.endResult) {
      return;
    }

    const data: MajorityElectionLotDecisionDialogData = {
      majorityElectionId: this.endResult.election.id,
    };

    const result = await this.dialogService.openForResult<
      MajorityElectionLotDecisionDialogComponent,
      MajorityElectionLotDecisionDialogResult
    >(MajorityElectionLotDecisionDialogComponent, data);

    if (result?.success) {
      this.lotDecisionProcessing = true;
    }
  }

  private async loadData(setLoading: boolean = true): Promise<void> {
    this.loading = setLoading;
    try {
      this.endResult = this.isPartialResult
        ? await this.resultService.getPartialEndResult(this.majorityElectionId)
        : await this.resultService.getEndResult(this.majorityElectionId);
      this.finalizeEnabled = !this.endResult.contest.cantonDefaults.endResultFinalizeDisabled;

      const secondaryCandidateEndResults = Array.prototype.concat.apply(
        [],
        this.endResult.secondaryMajorityElectionEndResults.map(x => x.candidateEndResults),
      );

      this.hasLotDecisions =
        !!this.endResult.candidateEndResults.find(x => x.lotDecisionEnabled) ||
        !!secondaryCandidateEndResults.find(x => x.lotDecisionEnabled);
      this.hasOpenRequiredLotDecisions =
        !!this.endResult.candidateEndResults.find(x => x.lotDecisionRequired && !x.lotDecision) ||
        !!secondaryCandidateEndResults.find(x => x.lotDecisionRequired && !x.lotDecision);
      this.endResultStep = !this.endResult.allCountingCirclesDone
        ? EndResultStep.CountingCirclesCounting
        : !this.endResult.finalized || !this.finalizeEnabled
          ? EndResultStep.AllCountingCirclesDone
          : EndResultStep.Finalized;
    } finally {
      this.loading = false;
    }
  }
}
