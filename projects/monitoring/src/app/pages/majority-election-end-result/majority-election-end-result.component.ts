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
} from 'ausmittlung-lib';
import { combineLatest, debounceTime, map, Subscription } from 'rxjs';
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
})
export class MajorityElectionEndResultComponent implements OnDestroy {
  public loading: boolean = true;
  public stepActionLoading: boolean = false;
  public endResult?: MajorityElectionEndResult;
  public hasLotDecisions: boolean = false;
  public hasOpenRequiredLotDecisions: boolean = false;
  public isPartialResult = false;
  public endResultStep?: EndResultStep;
  public finalizeEnabled = false;

  private readonly routeSubscription: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: MajorityElectionResultService,
    private readonly dialogService: DialogService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly secondFactorTransactionService: SecondFactorTransactionService,
  ) {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(results => ({ politicalBusinessId: results[0].politicalBusinessId, isPartialResult: results[1].partialResult })),
      )
      .subscribe(({ politicalBusinessId, isPartialResult }) => {
        this.isPartialResult = isPartialResult;
        this.loadData(politicalBusinessId);
      });
  }

  public async ngOnDestroy(): Promise<void> {
    this.routeSubscription.unsubscribe();
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

    this.updateEndResultByLotDecisions(result?.lotDecisions);
  }

  private async loadData(majorityElectionId: string): Promise<void> {
    this.loading = true;
    try {
      this.endResult = this.isPartialResult
        ? await this.resultService.getPartialEndResult(majorityElectionId)
        : await this.resultService.getEndResult(majorityElectionId);
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

  private updateEndResultByLotDecisions(lotDecisions: MajorityElectionEndResultLotDecision[] | undefined): void {
    if (!lotDecisions || !this.endResult) {
      return;
    }

    let candidateEndResultsById = groupBySingle(
      this.endResult.candidateEndResults,
      x => x.candidate.id,
      x => x,
    );
    for (const secondaryMajorityElectionEndResult of this.endResult.secondaryMajorityElectionEndResults) {
      candidateEndResultsById = {
        ...candidateEndResultsById,
        ...groupBySingle(
          secondaryMajorityElectionEndResult.candidateEndResults,
          x => x.candidate.id,
          x => x,
        ),
      };
    }

    for (const lotDecision of lotDecisions) {
      const candidateEndResult = candidateEndResultsById[lotDecision.candidateId];
      const electionCandidateEndResults = this.getElectionCandidateEndResults(lotDecision.candidateId);

      if (!!lotDecision.rank) {
        candidateEndResult.lotDecision = true;
        candidateEndResult.rank = lotDecision.rank;
      } else {
        const minRank = electionCandidateEndResults.map(c => c.voteCount).indexOf(candidateEndResult.voteCount) + 1;
        candidateEndResult.rank = minRank;
        candidateEndResult.lotDecision = false;
      }
    }

    this.endResult.candidateEndResults = this.endResult.candidateEndResults.sort((a, b) => a.rank - b.rank);
    for (const secondaryMajorityElectionEndResult of this.endResult.secondaryMajorityElectionEndResults) {
      secondaryMajorityElectionEndResult.candidateEndResults = secondaryMajorityElectionEndResult.candidateEndResults.sort(
        (a, b) => a.rank - b.rank,
      );
    }

    this.hasOpenRequiredLotDecisions = false;
  }

  private getElectionCandidateEndResults(candidateId: string): MajorityElectionCandidateEndResult[] {
    if (!this.endResult) {
      return [];
    }

    if (this.endResult.candidateEndResults.find(e => e.candidate.id == candidateId)) {
      return this.endResult.candidateEndResults;
    }

    for (const secondaryEndResult of this.endResult.secondaryMajorityElectionEndResults) {
      if (secondaryEndResult.candidateEndResults.find(e => e.candidate.id == candidateId)) {
        return secondaryEndResult.candidateEndResults;
      }
    }

    throw new Error('Election candidate end results not found');
  }
}
