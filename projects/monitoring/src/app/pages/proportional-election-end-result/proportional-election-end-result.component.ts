/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  dataSourceToPropertyPrefix,
  DoubleProportionalResultApportionmentState,
  EventLogService,
  groupBySingle,
  ProportionalElectionCandidateEndResult,
  ProportionalElectionCandidateEndResultState,
  ProportionalElectionEndResult,
  ProportionalElectionEndResultEventTypes,
  ProportionalElectionEndResultLotDecision,
  ProportionalElectionListEndResult,
  ProportionalElectionMandateAlgorithm,
  ProportionalElectionResultService,
  ProportionalElectionService,
  ProportionalElectionUnionResultService,
  SecondFactorTransactionService,
  sum,
  VotingDataSource,
} from 'ausmittlung-lib';
import { combineLatest, debounceTime, map, Subscription } from 'rxjs';
import {
  ProportionalElectionLotDecisionDialogComponent,
  ProportionalElectionLotDecisionDialogData,
  ProportionalElectionLotDecisionDialogResult,
} from '../../components/proportional-election-lot-decision-dialog/proportional-election-lot-decision-dialog.component';
import {
  ProportionalElectionManualEndResultDialogComponent,
  ProportionalElectionManualEndResultDialogData,
  ProportionalElectionManualEndResultDialogResult,
} from '../../components/proportional-election-manual-end-result-dialog/proportional-election-manual-end-result-dialog.component';
import { EndResultStep } from '../../models/end-result-step.model';

@Component({
  selector: 'app-proportional-election-end-result',
  templateUrl: './proportional-election-end-result.component.html',
  styleUrls: ['./proportional-election-end-result.component.scss'],
  standalone: false,
})
export class ProportionalElectionEndResultComponent implements OnDestroy {
  public dataPrefix?: string;

  public loading: boolean = true;
  public stepActionLoading: boolean = false;
  public dpResultIncomplete?: boolean;
  public endResult?: ProportionalElectionEndResult;
  public hasLotDecisions: boolean = false;
  public hasOpenRequiredLotDecisions: boolean = false;
  public selectedListEndResult?: ProportionalElectionListEndResult;
  public candidateEndResults: ProportionalElectionCandidateEndResult[] = [];
  public listColumns: string[] = [];
  public candidateColumns: string[] = [];
  public isPartialResult = false;
  private proportionalElectionId: string = '';
  private politicalBusinessUnionId?: string;
  public isNonUnionDoubleProportional = false;
  public endResultStep?: EndResultStep;
  public finalizeEnabled = false;
  public showMandateDistributionTrigger = false;

  private readonly routeSubscription: Subscription;
  private watchSubscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly resultService: ProportionalElectionResultService,
    private readonly unionResultService: ProportionalElectionUnionResultService,
    private readonly dialogService: DialogService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly secondFactorTransactionService: SecondFactorTransactionService,
    private readonly eventLogService: EventLogService,
  ) {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(([params, queryParams]) => ({
          politicalBusinessId: params.politicalBusinessId,
          politicalBusinessUnionId: params.politicalBusinessUnionId,
          isPartialResult: queryParams.partialResult,
        })),
      )
      .subscribe(async ({ politicalBusinessId, politicalBusinessUnionId, isPartialResult }) => {
        this.isPartialResult = isPartialResult;
        this.politicalBusinessUnionId = politicalBusinessUnionId;
        this.proportionalElectionId = politicalBusinessId;

        this.watchSubscription?.unsubscribe();
        delete this.watchSubscription;

        await this.loadData();

        this.watchSubscription = this.eventLogService
          .watch([...ProportionalElectionEndResultEventTypes], {
            contestId: this.endResult!.contest.id,
            politicalBusinessId: this.proportionalElectionId,
          })
          .pipe(debounceTime(1000)) // refresh once a second at max
          .subscribe(() => this.loadData(false));
      });
  }

  public async ngOnDestroy(): Promise<void> {
    this.routeSubscription.unsubscribe();
    this.watchSubscription?.unsubscribe();
  }

  public setDataPrefix(dataSource: VotingDataSource): void {
    this.dataPrefix = dataSourceToPropertyPrefix(dataSource);
  }

  public async handleEndResultStepChange(newStep: EndResultStep): Promise<void> {
    if (!this.endResultStep || !this.endResult) {
      return;
    }

    try {
      this.stepActionLoading = true;

      if (newStep > this.endResultStep) {
        if (newStep === EndResultStep.MandateDistributionTriggered) {
          await this.setMandateDistribution(true);
        } else {
          await this.setFinalized(true);
        }
      } else {
        if (newStep === EndResultStep.AllCountingCirclesDone) {
          await this.setMandateDistribution(false);
        } else {
          await this.setFinalized(false);
        }
      }

      this.endResultStep = newStep;
    } finally {
      this.stepActionLoading = false;
    }

    this.refreshTableColumns();
  }

  public async setMandateDistribution(distribute: boolean): Promise<void> {
    if (!this.endResult) {
      return;
    }

    const proportionalElectionId = this.endResult.election.id;

    if (distribute) {
      await this.resultService.startEndResultMandateDistribution(proportionalElectionId);
      this.endResult.mandateDistributionTriggered = true;
    } else {
      await this.resultService.revertEndResultMandateDistribution(proportionalElectionId);
      this.endResult.mandateDistributionTriggered = false;
      this.endResult.manualEndResultRequired = false;
      this.hasLotDecisions = false;
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
  }

  public async setFinalized(finalize: boolean): Promise<void> {
    if (!this.endResult || finalize === this.endResult.finalized) {
      return;
    }

    if (finalize) {
      this.endResult.finalized = true;

      const confirmed = await this.dialogService.confirm(
        'END_RESULT.PROPORTIONAL_ELECTION.CONFIRM.TITLE',
        'END_RESULT.PROPORTIONAL_ELECTION.CONFIRM.MESSAGE',
        'APP.CONFIRM',
      );
      if (!confirmed) {
        this.endResult.finalized = false;
        return;
      }

      const proportionalElectionId = this.endResult.election.id;
      const secondFactorTransaction = await this.resultService.prepareFinalizeEndResult(proportionalElectionId);

      await this.secondFactorTransactionService
        .showDialogAndExecuteVerifyAction(
          () => this.resultService.finalizeEndResult(proportionalElectionId, secondFactorTransaction.getId()),
          secondFactorTransaction.getCode(),
          secondFactorTransaction.getQrCode(),
        )
        .catch(err => {
          this.endResult!.finalized = false;
          throw err;
        });
    } else {
      await this.resultService.revertEndResultFinalization(this.endResult.election.id);
      this.endResult.finalized = false;
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
  }

  public async openUpdateLotDecisions(): Promise<void> {
    if (!this.endResult) {
      return;
    }

    const lists = this.endResult.listEndResults.filter(
      l => l.hasOpenRequiredLotDecisions || l.candidateEndResults.some(c => c.lotDecisionEnabled),
    );
    if (lists.length === 0) {
      return;
    }

    const data: ProportionalElectionLotDecisionDialogData = {
      lists,
    };

    const result = await this.dialogService.openForResult<
      ProportionalElectionLotDecisionDialogComponent,
      ProportionalElectionLotDecisionDialogResult
    >(ProportionalElectionLotDecisionDialogComponent, data);

    this.updateEndResultByLotDecisions(result?.lotDecisionsByListId);
  }

  public async openEnterManualEndResult(): Promise<void> {
    if (!this.endResult || this.endResult.listEndResults.length === 0) {
      return;
    }

    const data: ProportionalElectionManualEndResultDialogData = {
      lists: this.endResult.listEndResults,
      proportionalElectionId: this.endResult.election.id,
      listLotDecisions: this.endResult.listLotDecisions,
    };

    await this.dialogService.openForResult<
      ProportionalElectionManualEndResultDialogComponent,
      ProportionalElectionManualEndResultDialogResult
    >(ProportionalElectionManualEndResultDialogComponent, data);

    for (const listEndResult of this.endResult.listEndResults) {
      listEndResult.numberOfMandates = listEndResult.candidateEndResults.filter(
        x => x.state === ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_ELECTED,
      ).length;
    }
  }

  public selectListEndResult(listEndResult: ProportionalElectionListEndResult): void {
    this.selectedListEndResult = listEndResult;
    this.candidateEndResults = this.selectedListEndResult.candidateEndResults;
  }

  public async viewDpResult(): Promise<void> {
    await this.router.navigate(['double-proportional-results'], { relativeTo: this.route });
  }

  private async loadData(setLoading: boolean = true): Promise<void> {
    this.loading = setLoading;

    try {
      const endResult = this.isPartialResult
        ? await this.resultService.getPartialEndResult(this.proportionalElectionId)
        : await this.resultService.getEndResult(this.proportionalElectionId);
      this.isNonUnionDoubleProportional = ProportionalElectionService.isNonUnionDoubleProportional(endResult.election.mandateAlgorithm);
      this.finalizeEnabled = !endResult.contest.cantonDefaults.endResultFinalizeDisabled;

      this.showMandateDistributionTrigger =
        this.isNonUnionDoubleProportional ||
        endResult.election.mandateAlgorithm ===
          ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_HAGENBACH_BISCHOFF;

      // load the union info before setting the end result to the component prop,
      // otherwise the end result type selector does not set the disabled state.
      if (
        !this.isPartialResult &&
        !!this.politicalBusinessUnionId &&
        (endResult.election.mandateAlgorithm ===
          ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_DOUBLE_PROPORTIONAL_N_DOIS_5_DOI_OR_3_TOT_QUORUM ||
          endResult.election.mandateAlgorithm ===
            ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_DOUBLE_PROPORTIONAL_N_DOIS_5_DOI_QUORUM)
      ) {
        try {
          const dpResult = await this.unionResultService.getDoubleProportionalResult(this.politicalBusinessUnionId);
          this.dpResultIncomplete =
            dpResult.subApportionmentState !==
            DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_COMPLETED;
        } catch (err) {
          this.dpResultIncomplete = true;
        }
      } else {
        this.dpResultIncomplete = undefined;
      }

      this.endResult = endResult;
      this.hasLotDecisions = this.endResult.listEndResults.some(le => le.candidateEndResults.some(x => x.lotDecisionEnabled));
      this.hasOpenRequiredLotDecisions = this.endResult.listEndResults.some(l => l.hasOpenRequiredLotDecisions);
      this.refreshTableColumns();
      this.endResultStep = !endResult.allCountingCirclesDone
        ? EndResultStep.CountingCirclesCounting
        : !endResult.mandateDistributionTriggered
          ? EndResultStep.AllCountingCirclesDone
          : !endResult.finalized || !this.finalizeEnabled
            ? EndResultStep.MandateDistributionTriggered
            : EndResultStep.Finalized;
    } finally {
      this.loading = false;
    }

    if (this.hasOpenRequiredLotDecisions && this.endResult.allCountingCirclesDone && !this.endResult.contest.locked) {
      await this.openUpdateLotDecisions();
    }

    if (!this.endResult.manualEndResultRequired) {
      return;
    }

    const sumListNumberOfMandates = sum(this.endResult.listEndResults, x => x.numberOfMandates);
    if (sumListNumberOfMandates !== this.endResult.election.numberOfMandates) {
      await this.openEnterManualEndResult();
    }
  }

  private updateEndResultByLotDecisions(
    lotDecisionsByListId: Record<string, ProportionalElectionEndResultLotDecision[]> | undefined,
  ): void {
    if (!lotDecisionsByListId || !this.endResult) {
      return;
    }

    const listsById = groupBySingle(
      this.endResult.listEndResults,
      x => x.list.id,
      x => x,
    );
    for (const [listId, lotDecisions] of Object.entries(lotDecisionsByListId)) {
      const list = listsById[listId];
      const candidateEndResultsById = groupBySingle(
        list.candidateEndResults,
        x => x.candidate.id,
        x => x,
      );

      for (const lotDecision of lotDecisions) {
        const candidateEndResult = candidateEndResultsById[lotDecision.candidateId];
        this.updateCandidateEndResultByLotDecision(candidateEndResult, lotDecision, list);
      }

      list.candidateEndResults = list.candidateEndResults.sort((a, b) => a.rank - b.rank);
      list.hasOpenRequiredLotDecisions = false;

      if (list === this.selectedListEndResult) {
        this.candidateEndResults = [...this.selectedListEndResult.candidateEndResults];
      }
    }

    this.hasOpenRequiredLotDecisions = this.endResult.listEndResults.some(l => l.hasOpenRequiredLotDecisions);
  }

  private updateCandidateEndResultByLotDecision(
    candidateEndResult: ProportionalElectionCandidateEndResult,
    lotDecision: ProportionalElectionEndResultLotDecision,
    list: ProportionalElectionListEndResult,
  ): void {
    if (!!lotDecision.rank) {
      candidateEndResult.lotDecision = true;
      candidateEndResult.rank = lotDecision.rank;
      candidateEndResult.state =
        lotDecision.rank <= list.numberOfMandates
          ? ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_ELECTED
          : ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_NOT_ELECTED;
    } else {
      const minRank = list.candidateEndResults.map(c => c.voteCount).indexOf(candidateEndResult.voteCount) + 1;
      candidateEndResult.rank = minRank;
      candidateEndResult.lotDecision = false;
      candidateEndResult.state =
        candidateEndResult.rank <= list.numberOfMandates
          ? ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_PENDING
          : ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_NOT_ELECTED;
    }
  }

  private refreshTableColumns(): void {
    const showCalculationDetails = this.endResult?.mandateDistributionTriggered && this.endResult?.allCountingCirclesDone;
    this.listColumns = ['orderNumber', 'shortDescription', 'listVotesCount', 'blankRowsCount', 'totalVoteCount'];

    if (showCalculationDetails) {
      this.listColumns.push('nrOfMandates');
    }

    if (
      this.endResult?.election.mandateAlgorithm ===
      ProportionalElectionMandateAlgorithm.PROPORTIONAL_ELECTION_MANDATE_ALGORITHM_HAGENBACH_BISCHOFF
    ) {
      this.listColumns.push('listUnion', 'subListUnion');
    }

    this.candidateColumns = ['number', 'lastName', 'firstName', 'voteCount'];
    if (showCalculationDetails) {
      this.candidateColumns.push('rank');
    }

    this.candidateColumns.push('state');

    if (showCalculationDetails && this.hasLotDecisions && !this.hasOpenRequiredLotDecisions) {
      this.candidateColumns.push('lotDecision');
    }
  }
}
