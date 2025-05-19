/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, debounceTime, map, Subscription } from 'rxjs';
import {
  ProportionalElectionUnionResultService,
  ProportionalElectionUnionEndResult,
  SecondFactorTransactionService,
  ProportionalElectionService,
  ProportionalElectionEndResult,
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
  private readonly routeSubscription: Subscription;

  public loading: boolean = false;
  public finalizing: boolean = false;
  public endResult?: ProportionalElectionUnionEndResult;
  public isPartialResult = false;
  public isUnionDoubleProportional = false;
  public readonly columns: string[] = [
    'domainOfInfluence',
    'numberOfMandates',
    'countOfVoters',
    'countingCircleCountingDoneOf',
    'receivedBallots',
    'validBallots',
    'blankBallots',
    'invalidBallots',
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly secondFactorTransactionService: SecondFactorTransactionService,
    private readonly toast: SnackbarService,
    private readonly dialogService: DialogService,
    private readonly i18n: TranslateService,
    private readonly resultService: ProportionalElectionUnionResultService,
  ) {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(results => ({ politicalBusinessUnionId: results[0].politicalBusinessUnionId, isPartialResult: results[1].partialResult })),
      )
      .subscribe(({ politicalBusinessUnionId, isPartialResult }) => {
        this.isPartialResult = isPartialResult;
        this.loadData(politicalBusinessUnionId);
      });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
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
    } finally {
      this.finalizing = false;
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
    this.endResult.finalized = finalize;
  }
}
