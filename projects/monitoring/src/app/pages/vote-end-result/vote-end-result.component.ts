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
  SecondFactorTransactionService,
  VoteEndResult,
  VoteResultService,
  VoteEndResultEventTypes,
  EventLogService,
} from 'ausmittlung-lib';
import { combineLatest, debounceTime, map, Subscription } from 'rxjs';
import { EndResultStep } from '../../models/end-result-step.model';

@Component({
  selector: 'app-vote-end-result',
  templateUrl: './vote-end-result.component.html',
  styleUrls: ['./vote-end-result.component.scss'],
  standalone: false,
})
export class VoteEndResultComponent implements OnDestroy {
  public loading: boolean = true;
  public stepActionLoading: boolean = false;
  public endResult?: VoteEndResult;
  public isPartialResult = false;
  public voteId = '';
  public endResultStep?: EndResultStep;
  public finalizeEnabled = false;

  private readonly routeSubscription: Subscription;
  private watchSubscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: VoteResultService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly dialog: DialogService,
    private readonly eventLogService: EventLogService,
    private readonly secondFactorTransactionService: SecondFactorTransactionService,
  ) {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(([params, queryParams]) => ({ politicalBusinessId: params.politicalBusinessId, isPartialResult: queryParams.partialResult })),
      )
      .subscribe(async ({ politicalBusinessId, isPartialResult }) => {
        this.isPartialResult = isPartialResult;
        this.voteId = politicalBusinessId;

        this.watchSubscription?.unsubscribe();
        delete this.watchSubscription;

        await this.loadData(politicalBusinessId);

        this.watchSubscription = this.eventLogService
          .watch([...VoteEndResultEventTypes], { contestId: this.endResult!.contest.id, politicalBusinessId: this.voteId })
          .pipe(debounceTime(1000)) // refresh once a second at max
          .subscribe(() => this.loadData(false));
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

      const confirmed = await this.dialog.confirm('VOTE_END_RESULT.CONFIRM.TITLE', 'VOTE_END_RESULT.CONFIRM.MESSAGE', 'APP.CONFIRM');
      if (!confirmed) {
        this.endResult!.finalized = false;
        return;
      }

      const voteId = this.endResult.vote.id;
      const secondFactorTransaction = await this.resultService.prepareFinalizeEndResult(voteId);

      await this.secondFactorTransactionService
        .showDialogAndExecuteVerifyAction(
          () => this.resultService.finalizeEndResult(voteId, secondFactorTransaction.getId()),
          secondFactorTransaction.getCode(),
          secondFactorTransaction.getQrCode(),
        )
        .catch(err => {
          this.endResult!.finalized = false;
          throw err;
        });
    } else {
      await this.resultService.revertEndResultFinalization(this.endResult.vote.id);
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
    this.endResult.finalized = finalize;
  }

  private async loadData(setLoading: boolean = true): Promise<void> {
    this.loading = setLoading;
    try {
      this.endResult = this.isPartialResult
        ? await this.resultService.getPartialEndResult(this.voteId)
        : await this.resultService.getEndResult(this.voteId);
      this.finalizeEnabled = !this.endResult.contest.cantonDefaults.endResultFinalizeDisabled;
      this.endResultStep = !this.endResult.allCountingCirclesDone
        ? EndResultStep.CountingCirclesCounting
        : !this.endResult.finalized
          ? EndResultStep.AllCountingCirclesDone
          : EndResultStep.Finalized;
    } finally {
      this.loading = false;
    }
  }
}
