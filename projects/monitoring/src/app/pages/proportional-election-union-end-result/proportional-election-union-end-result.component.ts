/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, debounceTime, map, Subscription } from 'rxjs';
import {
  ProportionalElectionUnionResultService,
  ProportionalElectionUnionEndResult,
  SecondFactorTransactionService,
  ProportionalElectionService,
  ProportionalElectionEndResult,
  EventLogService,
  ProportionalElectionUnionEndResultEventTypes,
} from 'ausmittlung-lib';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-proportional-election-union-end-result',
  templateUrl: './proportional-election-union-end-result.component.html',
  styleUrls: ['./proportional-election-union-end-result.component.scss'],
  standalone: false,
})
export class ProportionalElectionUnionEndResultComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly secondFactorTransactionService = inject(SecondFactorTransactionService);
  private readonly toast = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly i18n = inject(TranslateService);
  private readonly resultService = inject(ProportionalElectionUnionResultService);
  private readonly eventLogService = inject(EventLogService);

  private readonly routeSubscription: Subscription;

  private readonly defaultColumns: string[] = [
    'domainOfInfluence',
    'numberOfMandates',
    'countOfVoters',
    'countingCircleCountingDoneOf',
    'receivedBallots',
    'validBallots',
    'blankBallots',
    'invalidBallots',
  ];

  public loading: boolean = false;
  public finalizing: boolean = false;
  public endResult?: ProportionalElectionUnionEndResult;
  public isPartialResult = false;
  public isUnionDoubleProportional = false;
  public isDoubleProportional = false;
  public columns: string[] = [];

  private watchSubscription?: Subscription;

  constructor() {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(results => ({ politicalBusinessUnionId: results[0].politicalBusinessUnionId, isPartialResult: results[1].partialResult })),
      )
      .subscribe(async ({ politicalBusinessUnionId, isPartialResult }) => {
        this.isPartialResult = isPartialResult;
        this.watchSubscription?.unsubscribe();

        await this.loadData(politicalBusinessUnionId);

        this.watchSubscription = this.eventLogService
          .watch([...ProportionalElectionUnionEndResultEventTypes], {
            contestId: this.endResult!.contest.id,
            politicalBusinessUnionId,
          })
          .pipe(debounceTime(1000)) // refresh once a second at max
          .subscribe(() => {
            this.loadData(politicalBusinessUnionId);
            this.finalizing = false;
          });
      });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.watchSubscription?.unsubscribe();
  }

  public async loadData(politicalBusinessUnionId: string): Promise<void> {
    this.loading = true;
    try {
      this.endResult = this.isPartialResult
        ? await this.resultService.getPartialEndResult(politicalBusinessUnionId)
        : await this.resultService.getEndResult(politicalBusinessUnionId);
      this.isUnionDoubleProportional = this.endResult.proportionalElectionEndResults.some(e =>
        ProportionalElectionService.isUnionDoubleProportional(e.election.mandateAlgorithm),
      );
      this.isDoubleProportional = this.endResult.proportionalElectionEndResults.some(e =>
        ProportionalElectionService.isDoubleProportional(e.election.mandateAlgorithm),
      );
      this.refreshTableColumns();
    } finally {
      this.loading = false;
    }
  }

  public selectElectionEndResult(electionEndResult: ProportionalElectionEndResult) {
    const extras = {
      relativeTo: this.route,
      queryParams: this.isPartialResult ? { partialResult: true } : undefined,
    };

    this.router.navigate(['proportional-election-end-results', electionEndResult.election.id], extras);
  }

  public async viewDpResult(): Promise<void> {
    await this.router.navigate(['double-proportional-results'], { relativeTo: this.route });
  }

  public async setFinalized(finalize: boolean): Promise<void> {
    if (!this.endResult || finalize === this.endResult.finalized) {
      return;
    }

    try {
      this.finalizing = true;

      if (finalize) {
        const confirmed = await this.dialogService.confirm(
          'UNION_END_RESULT.PROPORTIONAL_ELECTION.CONFIRM.TITLE',
          'UNION_END_RESULT.PROPORTIONAL_ELECTION.CONFIRM.MESSAGE',
          'APP.CONFIRM',
        );

        if (!confirmed) {
          this.finalizing = false;
          return;
        }

        const unionId = this.endResult.proportionalElectionUnion.id;
        const secondFactorTransaction = await this.resultService.prepareFinalizeEndResult(unionId);

        this.endResult.finalized = true;
        await this.secondFactorTransactionService
          .showDialogAndExecuteVerifyAction(
            () => this.resultService.finalizeEndResult(unionId, secondFactorTransaction.getId()),
            secondFactorTransaction.getCode(),
            secondFactorTransaction.getQrCode(),
          )
          .catch(err => {
            this.endResult!.finalized = false;
            throw err;
          });
      } else {
        await this.resultService.revertEndResultFinalization(this.endResult.proportionalElectionUnion.id);
        this.endResult.finalized = false;
      }
    } catch (err) {
      this.finalizing = false;
      throw err;
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
    this.endResult.finalized = finalize;
  }

  private refreshTableColumns(): void {
    if (!this.endResult) {
      return;
    }

    this.columns = [...this.defaultColumns];

    if (!this.isDoubleProportional) {
      this.columns.push('lotDecisionState');
    }
  }
}
