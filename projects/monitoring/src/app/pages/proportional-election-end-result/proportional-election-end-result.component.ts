/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  dataSourceToPropertyPrefix,
  DoubleProportionalResultApportionmentState,
  EventLogService,
  groupBySingle,
  PoliticalBusiness,
  PoliticalBusinessType,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resultService = inject(ProportionalElectionResultService);
  private readonly unionResultService = inject(ProportionalElectionUnionResultService);
  private readonly dialogService = inject(DialogService);
  private readonly i18n = inject(TranslateService);
  private readonly toast = inject(SnackbarService);
  private readonly secondFactorTransactionService = inject(SecondFactorTransactionService);
  private readonly eventLogService = inject(EventLogService);

  public dataPrefix?: string;

  public loading: boolean = true;
  public stepActionLoading: boolean = false;
  public dpResultIncomplete?: boolean;
  public endResult?: ProportionalElectionEndResult;
  public accessiblePoliticalBusinesses: PoliticalBusiness[] = [];
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
  public isDoubleProportional = false;
  public hasOpenNonUnionDoubleProportionLotDecision = false;
  public endResultStep?: EndResultStep;
  public finalizeEnabled = false;
  public showMandateDistributionTrigger = false;
  public showExport = false;

  private readonly routeSubscription: Subscription;
  private watchSubscription?: Subscription;

  constructor() {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(([params, queryParams]) => ({
          politicalBusinessId: params.politicalBusinessId,
          politicalBusinessUnionId: params.politicalBusinessUnionId,
          isPartialResult: queryParams.partialResult,
          submissionFinishedAndAuditedTentatively: queryParams.submissionFinishedAndAuditedTentatively,
        })),
      )
      .subscribe(async ({ politicalBusinessId, politicalBusinessUnionId, isPartialResult, submissionFinishedAndAuditedTentatively }) => {
        this.isPartialResult = isPartialResult;
        this.politicalBusinessUnionId = politicalBusinessUnionId;
        this.proportionalElectionId = politicalBusinessId;

        this.watchSubscription?.unsubscribe();
        delete this.watchSubscription;

        await this.loadData();

        if (!!submissionFinishedAndAuditedTentatively && this.showExport) {
          this.router.navigate(['../../', 'contests', this.endResult!.contest.id, 'exports'], { relativeTo: this.route });
        }

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

    let waitForWatcher = false;
    let success = false;

    try {
      this.stepActionLoading = true;

      if (newStep > this.endResultStep) {
        if (newStep === EndResultStep.MandateDistributionTriggered) {
          success = waitForWatcher = await this.setMandateDistribution(true);
        } else {
          success = await this.setFinalized(true);
        }
      } else {
        if (newStep === EndResultStep.AllCountingCirclesDone) {
          success = waitForWatcher = await this.setMandateDistribution(false);
        } else {
          success = await this.setFinalized(false);
        }
      }

      if (success && !waitForWatcher) {
        this.endResultStep = newStep;
      }

      this.updateShowExport();
    } finally {
      if (!waitForWatcher) {
        this.stepActionLoading = false;
      }
    }
  }

  public async setMandateDistribution(distribute: boolean): Promise<boolean> {
    if (!this.endResult) {
      return false;
    }

    const proportionalElectionId = this.endResult.election.id;

    try {
      if (distribute) {
        await this.resultService.startEndResultMandateDistribution(proportionalElectionId);
      } else {
        await this.resultService.revertEndResultMandateDistribution(proportionalElectionId);
      }

      this.toast.success(this.i18n.instant('APP.SAVED'));
      return true;
    } catch {
      this.toast.error(this.i18n.instant('APP.ERROR_MESSAGE'));
      return false;
    }
  }

  public async setFinalized(finalize: boolean): Promise<boolean> {
    if (!this.endResult || finalize === this.endResult.finalized) {
      return false;
    }

    try {
      if (finalize) {
        const confirmed = await this.dialogService.confirm(
          'END_RESULT.PROPORTIONAL_ELECTION.CONFIRM.TITLE',
          'END_RESULT.PROPORTIONAL_ELECTION.CONFIRM.MESSAGE',
          'APP.CONFIRM',
        );
        if (!confirmed) {
          return false;
        }

        const proportionalElectionId = this.endResult.election.id;
        const secondFactorTransaction = await this.resultService.prepareFinalizeEndResult(proportionalElectionId);
        this.endResult.finalized = true;

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
      return true;
    } catch {
      return false;
    }
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
    >(ProportionalElectionLotDecisionDialogComponent, data, { disableClose: true });

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
      this.isDoubleProportional = ProportionalElectionService.isDoubleProportional(endResult.election.mandateAlgorithm);

      if (!!this.politicalBusinessUnionId) {
        const politicalBusinessUnionEndResult = !this.isPartialResult
          ? await this.unionResultService.getEndResult(this.politicalBusinessUnionId)
          : await this.unionResultService.getPartialEndResult(this.politicalBusinessUnionId);

        this.accessiblePoliticalBusinesses = politicalBusinessUnionEndResult.proportionalElectionEndResults.map(e => ({
          ...e.election,
          politicalBusinessType: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION,
        }));
      }

      if (this.isNonUnionDoubleProportional && !this.isPartialResult && endResult.mandateDistributionTriggered) {
        const dpResult = await this.resultService.getDoubleProportionalResult(this.proportionalElectionId);
        this.hasOpenNonUnionDoubleProportionLotDecision =
          dpResult.superApportionmentState ===
          DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_HAS_OPEN_LOT_DECISION;
      } else {
        this.hasOpenNonUnionDoubleProportionLotDecision = false;
      }

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
      this.selectedListEndResult = undefined;
      this.updateShowExport();
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

      // Explicitly set step action loading to false, since this could be true if the user waits for a auto-refresh.
      this.stepActionLoading = false;
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

      if (list === this.selectedListEndResult) {
        this.candidateEndResults = [...this.selectedListEndResult.candidateEndResults];
      }
    }

    this.hasOpenRequiredLotDecisions = this.endResult.listEndResults.some(l => l.hasOpenRequiredLotDecisions);
    this.updateShowExport();
  }

  private updateCandidateEndResultByLotDecision(
    candidateEndResult: ProportionalElectionCandidateEndResult,
    lotDecision: ProportionalElectionEndResultLotDecision,
    list: ProportionalElectionListEndResult,
  ): void {
    if (!!lotDecision.rank) {
      candidateEndResult.lotDecision = true;
      candidateEndResult.rank = lotDecision.rank;
    } else {
      const minRank = list.candidateEndResults.map(c => c.voteCount).indexOf(candidateEndResult.voteCount) + 1;
      candidateEndResult.rank = minRank;
      candidateEndResult.lotDecision = false;
    }

    if (candidateEndResult.rank > list.numberOfMandates) {
      candidateEndResult.state = ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_NOT_ELECTED;
      return;
    }

    candidateEndResult.state =
      candidateEndResult.lotDecisionRequired && !candidateEndResult.lotDecision
        ? ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_PENDING
        : ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_ELECTED;
  }

  private refreshTableColumns(): void {
    const showCalculationDetails = this.endResult?.mandateDistributionTriggered && this.endResult?.allCountingCirclesDone;
    this.listColumns = ['orderNumber', 'shortDescription', 'listVotesCount', 'blankRowsCount', 'totalVoteCount'];

    if (showCalculationDetails) {
      this.listColumns.push('nrOfMandates');

      if (!this.isDoubleProportional) {
        this.listColumns.push('lotDecisionState');
      }
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

  private updateShowExport(): void {
    this.showExport = this.endResult!.finalized && !this.hasOpenRequiredLotDecisions;
  }
}
