/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SegmentedControl } from '@abraxas/base-components/lib/components/formfields/segmented-control-group/segmented-control.model';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContestCantonDefaults,
  CountingCircle,
  CountingCircleResultState,
  distinct,
  DomainOfInfluenceType,
  flatten,
  groupBy,
  groupBySingle,
  MajorityElectionResultService,
  PoliticalBusinessUnion,
  ProportionalElectionResultService,
  ResultOverview,
  ResultOverviewCountingCircleResult,
  ResultOverviewCountingCircleResults,
  ResultService,
  SimplePoliticalBusiness,
  VoteResultService,
} from 'ausmittlung-lib';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizationService, Tenant } from '@abraxas/base-components';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';

@Component({
  selector: 'app-monitoring-cockpit-grid',
  templateUrl: './monitoring-cockpit-grid.component.html',
  styleUrls: ['./monitoring-cockpit-grid.component.scss'],
})
export class MonitoringCockpitGridComponent implements OnInit, OnDestroy {
  private static emptyStateFilter: CountingCircleResultState[] = [];
  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;
  public readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  @Input()
  public newZhFeaturesEnabled: boolean = false;

  @Input()
  public publishResultsEnabled: boolean = false;

  @Input()
  public publishResultsBeforeAuditedTentatively: boolean = false;

  @Input()
  public resultOverview?: ResultOverview;

  public domainOfInfluenceTypeFilter?: DomainOfInfluenceType;
  public politicalBusinessFilter?: SimplePoliticalBusiness;
  public politicalBusinessUnionFilter?: PoliticalBusinessUnion;
  public countingCircleFilter?: CountingCircle;
  public showDetails: boolean = false;
  public plausibiliseLoading: boolean = false;

  public gridTemplateColumns: string = '';
  public readOnly: boolean = true;

  public filteredDomainOfInfluenceTypes: DomainOfInfluenceType[] = [];
  public filteredPoliticalBusinessesByDoiType: Record<number, SimplePoliticalBusiness[]> = [];
  public filteredPoliticalBusinesses: SimplePoliticalBusiness[] = [];
  public filteredPoliticalBusinessUnions: PoliticalBusinessUnion[] = [];
  public filteredCountingCircleResults: FilteredCountingCircleResults[] = [];

  public countingCircles: CountingCircle[] = [];
  public countingCircleResults: FilteredCountingCircleResults[] = [];

  public politicalBusinessUnionByPoliticalBusinessId: Record<string, PoliticalBusinessUnion> = {};
  public filteredPoliticalBusinessUnionsByDoiType: Record<number, PoliticalBusinessUnion[]> = [];
  public politicalBusinessUnions: PoliticalBusinessUnion[] = [];

  public contestCantonDefaults?: ContestCantonDefaults;
  public allStateFilters: SegmentedControl[] = [];
  public stateFilter: CountingCircleResultState[] = MonitoringCockpitGridComponent.emptyStateFilter;

  public clearingFilter: boolean = false;
  public publishing: boolean = false;

  private politicalBusinesses: SimplePoliticalBusiness[] = [];
  public notOwnedPoliticalBusinessIds: string[] = [];
  private readonly isCorrectedStates: CountingCircleResultState[] = [
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED,
  ];

  private resultsById: Record<
    string,
    { result: ResultOverviewCountingCircleResult; countingCircleResults: FilteredCountingCircleResults }
  > = {};

  private contestId: string = '';
  private tenant?: Tenant;

  private stateChangesSubscription?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly resultService: ResultService,
    private readonly i18n: TranslateService,
    private readonly auth: AuthorizationService,
    private readonly voteResultService: VoteResultService,
    private readonly proportionalElectionResultService: ProportionalElectionResultService,
    private readonly majorityElectionResultService: MajorityElectionResultService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.tenant = await this.auth.getActiveTenant();

    if (!this.resultOverview) {
      return;
    }

    this.stateChangesSubscription?.unsubscribe();

    this.contestId = this.resultOverview.contest.id;
    this.contestCantonDefaults = this.resultOverview.contest.cantonDefaults;
    this.readOnly = this.resultOverview.contest.locked;

    this.politicalBusinesses = this.resultOverview.politicalBusinesses;

    // When partial results are present, we cannot determine whether political business are owned via the tenant.
    // Partial results count as "owned", but the current tenant is not the owner of the political business.
    // As a workaround, treat all political businesses as owned in this case.
    if (!this.resultOverview.hasPartialResults) {
      this.politicalBusinesses = this.resultOverview.politicalBusinesses.filter(
        x => x.domainOfInfluence?.secureConnectId === this.tenant?.id,
      );
      this.notOwnedPoliticalBusinessIds = this.resultOverview.politicalBusinesses
        .filter(x => x.domainOfInfluence?.secureConnectId !== this.tenant?.id)
        .map(x => x.id);
    }

    this.politicalBusinessUnions = this.resultOverview.politicalBusinessUnions.filter(x => x.politicalBusinesses.length !== 0);
    this.politicalBusinessUnionByPoliticalBusinessId = groupBySingle(
      flatten(this.politicalBusinessUnions.map(u => u.politicalBusinesses.map(p => ({ union: u, politicalBusiness: p })))),
      x => x.politicalBusiness.id,
      x => x.union,
    );
    this.sortCountingCircleResults();

    this.resultsById = groupBySingle(
      flatten(this.countingCircleResults.map(r => r.results.map(x => ({ result: x, countingCircleResults: r })))),
      x => x.result.id,
      x => x,
    );

    this.countingCircles = this.countingCircleResults.map(x => x.countingCircle!);

    this.updateFilters();
    this.startChangesListener();

    this.allStateFilters = [
      {
        displayText: this.i18n.instant('MONITORING_COCKPIT.FILTER_STATE.ALL'),
        value: MonitoringCockpitGridComponent.emptyStateFilter,
        disabled: false,
      },
      this.createSegmentedControl(CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING, [
        CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING,
        CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION,
      ]),
      this.createSegmentedControl(CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE, [
        CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE,
        CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE,
      ]),
      this.createSegmentedControl(CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY, [
        CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY,
      ]),
    ];

    if (!this.contestCantonDefaults.statePlausibilisedDisabled) {
      this.allStateFilters.push(
        this.createSegmentedControl(CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED, [
          CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED,
        ]),
      );
    }
  }

  public ngOnDestroy(): void {
    this.stateChangesSubscription?.unsubscribe();
  }

  public domainOfInfluenceTypeFilterClicked(value: DomainOfInfluenceType): void {
    if (this.politicalBusinessFilter || this.politicalBusinessUnionFilter) {
      delete this.politicalBusinessFilter;
      delete this.politicalBusinessUnionFilter;
      this.updateFilters();
      return;
    }

    if (this.domainOfInfluenceTypeFilter === value) {
      delete this.domainOfInfluenceTypeFilter;
      this.updateFilters();
      return;
    }

    this.domainOfInfluenceTypeFilter = value;
    this.updateFilters();
  }

  public politicalBusinessFilterClicked(politicalBusiness: any, type: DomainOfInfluenceType): void {
    if (politicalBusiness === this.politicalBusinessFilter) {
      delete this.domainOfInfluenceTypeFilter;
      delete this.politicalBusinessFilter;
      delete this.politicalBusinessUnionFilter;
      this.updateFilters();
      return;
    }

    this.domainOfInfluenceTypeFilter = type;
    this.politicalBusinessFilter = politicalBusiness;
    this.updateFilters();
  }

  public politicalBusinessUnionFilterClicked(union: PoliticalBusinessUnion, type: DomainOfInfluenceType): void {
    if (union === this.politicalBusinessUnionFilter) {
      delete this.domainOfInfluenceTypeFilter;
      delete this.politicalBusinessFilter;
      delete this.politicalBusinessUnionFilter;
      this.updateFilters();
      return;
    }

    this.domainOfInfluenceTypeFilter = type;
    this.politicalBusinessUnionFilter = union;
    this.updateFilters();
  }

  public countingCircleFilterSelected(cc: CountingCircle | undefined): void {
    if (this.clearingFilter) {
      this.clearingFilter = false;
      return;
    }

    if (this.stateFilter.length > 0) {
      this.clearingFilter = true;
      this.stateFilter = MonitoringCockpitGridComponent.emptyStateFilter;
    }

    this.countingCircleFilter = cc;
    this.updateFilters();
  }

  public updateFilters(): void {
    this.updateFilteredPoliticalBusinesses();
    this.updateFilteredPoliticalBusinessUnions();
    this.updateCountingCircleFilter();
    this.removeUnneededPoliticalBusiness();
    this.updatePoliticalBusinessFilterGroups();
    this.updateGrid();
    this.showDetails = !!this.domainOfInfluenceTypeFilter || !!this.politicalBusinessFilter || !!this.politicalBusinessUnionFilter;
  }

  public async openDetail(countingCircle: CountingCircle, politicalBusiness?: SimplePoliticalBusiness): Promise<void> {
    await this.router.navigate([countingCircle.id], {
      relativeTo: this.route,
      queryParams: {
        politicalBusinessId: politicalBusiness?.id,
      },
    });
  }

  public stateFilterSelected(states: CountingCircleResultState[]): void {
    if (this.clearingFilter) {
      this.clearingFilter = false;
      return;
    }

    if (!!this.countingCircleFilter) {
      this.clearingFilter = true;
      delete this.countingCircleFilter;
    }

    this.stateFilter = states;
    this.updateFilters();
  }

  public async updatePublished(
    published: boolean,
    businessType: PoliticalBusinessType,
    results: ResultOverviewCountingCircleResult[],
  ): Promise<void> {
    try {
      this.publishing = true;

      if (published) {
        await this.publish(
          businessType,
          results.map(x => x.id),
        );
      } else {
        await this.unpublish(
          businessType,
          results.map(x => x.id),
        );
      }
    } finally {
      this.publishing = false;
    }
  }

  private async publish(businessType: PoliticalBusinessType, resultIds: string[]): Promise<void> {
    switch (businessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        await this.voteResultService.publish(resultIds);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        await this.proportionalElectionResultService.publish(resultIds);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION:
        await this.majorityElectionResultService.publish(resultIds);
        break;
    }
  }

  private async unpublish(businessType: PoliticalBusinessType, resultIds: string[]): Promise<void> {
    switch (businessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        await this.voteResultService.unpublish(resultIds);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        await this.proportionalElectionResultService.unpublish(resultIds);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION:
        await this.majorityElectionResultService.unpublish(resultIds);
        break;
    }
  }

  private createSegmentedControl(descriptionState: CountingCircleResultState, filterValues: CountingCircleResultState[]): SegmentedControl {
    return {
      displayText:
        this.contestCantonDefaults?.countingCircleResultStateDescriptionsByState[descriptionState] ??
        this.i18n.instant('COUNTING_CIRCLE_RESULT_STATE.' + descriptionState),
      value: filterValues,
      disabled: false,
    };
  }

  private startChangesListener(): void {
    if (!this.contestId || !this.resultService || this.readOnly) {
      return;
    }

    this.stateChangesSubscription?.unsubscribe();
    this.stateChangesSubscription = this.resultService
      .getStateChanges(this.contestId, this.onStateChangeListenerRetry.bind(this))
      .subscribe(({ id, newState }) => this.updateState(id, newState));
  }

  private async onStateChangeListenerRetry(): Promise<void> {
    if (!this.stateChangesSubscription) {
      return;
    }

    // When the export state change listener fails, it is being retried with an exponential backoff
    // During that retry backoff, changes aren't being delivered -> we need to poll for them
    const data = await this.resultService.getOverview(this.contestId);
    for (const countingCircleResult of data.countingCircleResults) {
      for (const result of countingCircleResult.results) {
        this.updateState(result.id, result.state);
      }
    }
  }

  private updateState(id: string, newState: CountingCircleResultState): void {
    const { result, countingCircleResults } = this.resultsById[id] || {};
    if (!result || result.state === newState) {
      return;
    }

    result.state = newState;

    countingCircleResults.minResultState = this.getMinResultState(countingCircleResults);
    switch (result.state) {
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING:
        result.submissionDoneTimestamp = undefined;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION:
        result.submissionDoneTimestamp = undefined;
        result.readyForCorrectionTimestamp = new Date();
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE:
        result.submissionDoneTimestamp = new Date();
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE:
        result.submissionDoneTimestamp = new Date();
        result.readyForCorrectionTimestamp = undefined;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY:
        result.auditedTentativelyTimestamp = new Date();
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED:
        result.plausibilisedTimestamp = new Date();
        break;
    }

    this.sortCountingCircleResults();
    this.updateFilters();
  }

  private sortCountingCircleResults(): void {
    if (!this.resultOverview) {
      return;
    }

    this.countingCircleResults = this.resultOverview.countingCircleResults.sort(this.countingCircleResultsComparer).map(x => ({
      ...x,
      minResultState: this.getMinResultState(x),
      isCorrected: false,
      filteredResults: x.results,
      resultsByPoliticalBusinessId: groupBySingle(
        x.results,
        y => y.politicalBusinessId,
        y => y,
      ),
      resultsByPoliticalBusinessUnionId: groupBy(
        x.results.filter(y => !!this.politicalBusinessUnionByPoliticalBusinessId[y.politicalBusinessId]),
        y => this.politicalBusinessUnionByPoliticalBusinessId[y.politicalBusinessId].id,
        y => y,
      ),
      resultsByCountingCircleId: groupBy(
        x.results.filter(y => this.notOwnedPoliticalBusinessIds.includes(y.politicalBusinessId)),
        y => y.countingCircleId,
        y => y,
      ),
    }));
  }

  private updateFilteredPoliticalBusinesses(): void {
    if (this.politicalBusinessUnionFilter) {
      this.filteredPoliticalBusinesses = [];
      return;
    }

    if (!this.domainOfInfluenceTypeFilter) {
      this.filteredPoliticalBusinesses = this.politicalBusinesses;
      return;
    }

    if (!this.politicalBusinessFilter) {
      this.filteredPoliticalBusinesses = this.politicalBusinesses.filter(
        x => x.domainOfInfluence!.type === this.domainOfInfluenceTypeFilter,
      );
    } else {
      this.filteredPoliticalBusinesses = [this.politicalBusinessFilter];
    }
  }

  private updateFilteredPoliticalBusinessUnions(): void {
    if (this.politicalBusinessFilter) {
      this.filteredPoliticalBusinessUnions = [];
      return;
    }

    if (!this.domainOfInfluenceTypeFilter) {
      this.filteredPoliticalBusinessUnions = this.politicalBusinessUnions;
      return;
    }

    if (!this.politicalBusinessUnionFilter) {
      this.filteredPoliticalBusinessUnions = this.politicalBusinessUnions.filter(
        x => x.politicalBusinesses[0].domainOfInfluence!.type === this.domainOfInfluenceTypeFilter,
      );
    } else {
      this.filteredPoliticalBusinessUnions = [this.politicalBusinessUnionFilter];
    }
  }

  private updateCountingCircleFilter(): void {
    this.filteredCountingCircleResults = this.countingCircleResults;

    if (this.countingCircleFilter) {
      this.filteredCountingCircleResults = this.filteredCountingCircleResults.filter(
        x => x.countingCircle?.id === this.countingCircleFilter?.id,
      );
    }

    for (const cc of this.filteredCountingCircleResults) {
      cc.filteredResults = this.filteredPoliticalBusinesses
        .concat(flatten(this.filteredPoliticalBusinessUnions.map(x => x.politicalBusinesses)))
        .map(pb => cc.resultsByPoliticalBusinessId[pb.id])
        .filter(r => !!r);
      cc.isCorrected = cc.filteredResults.every(y => this.isCorrectedStates.includes(y.state));
    }

    this.filteredCountingCircleResults = this.filteredCountingCircleResults.filter(
      x => x.filteredResults.length > 0 && (this.stateFilter.length === 0 || this.stateFilter.includes(x.minResultState)),
    );
  }

  private removeUnneededPoliticalBusiness(): void {
    const filteredPoliticalBusinessIds = new Set(
      flatten(this.filteredCountingCircleResults.map(cc => cc.filteredResults)).map(r => r.politicalBusinessId),
    );

    const politicalBusinessIdsInUnions = new Set(
      flatten(this.filteredPoliticalBusinessUnions.map(u => u.politicalBusinesses)).map(x => x.id),
    );

    this.filteredPoliticalBusinesses = this.filteredPoliticalBusinesses.filter(
      pb => filteredPoliticalBusinessIds.has(pb.id) && !politicalBusinessIdsInUnions.has(pb.id),
    );
    this.filteredPoliticalBusinessUnions = this.filteredPoliticalBusinessUnions.filter(u =>
      u.politicalBusinesses.some(pb => filteredPoliticalBusinessIds.has(pb.id)),
    );
  }

  private updatePoliticalBusinessFilterGroups(): void {
    this.filteredPoliticalBusinessesByDoiType = groupBy(
      this.filteredPoliticalBusinesses,
      pb => pb.domainOfInfluence?.type as number,
      pb => pb,
    );
    this.filteredDomainOfInfluenceTypes = distinct(
      this.filteredPoliticalBusinesses
        .map(x => x.domainOfInfluence!.type as DomainOfInfluenceType)
        .concat(this.filteredPoliticalBusinessUnions.map(x => x.politicalBusinesses[0].domainOfInfluence!.type as DomainOfInfluenceType)),
      x => x,
    ).sort();

    this.filteredPoliticalBusinessUnionsByDoiType = groupBy(
      this.filteredPoliticalBusinessUnions,
      u => u.politicalBusinesses[0].domainOfInfluence?.type as number,
      u => u,
    );
  }

  private updateGrid(): void {
    const showNotOwnedPoliticalBusinessColumn =
      this.notOwnedPoliticalBusinessIds.length > 0 &&
      !this.politicalBusinessFilter &&
      !this.politicalBusinessUnionFilter &&
      !this.domainOfInfluenceTypeFilter;
    const polBusinessColCount = Math.max(
      this.filteredPoliticalBusinesses.length + this.filteredPoliticalBusinessUnions.length + (showNotOwnedPoliticalBusinessColumn ? 1 : 0),
      1,
    );
    // first two columns are the color box and the name of the counting circle
    this.gridTemplateColumns = `2rem min-content repeat(${polBusinessColCount}, minmax(0, 1fr))`;
  }

  private getMinResultState(ccResults: ResultOverviewCountingCircleResults): CountingCircleResultState {
    return Math.min(
      ...ccResults.results.filter(r => !this.notOwnedPoliticalBusinessIds.includes(r.politicalBusinessId)).map(x => x.state as number),
    ) as CountingCircleResultState;
  }

  private countingCircleResultsComparer(a: ResultOverviewCountingCircleResults, b: ResultOverviewCountingCircleResults): number {
    // 1. order criteria: descending ResultState.Done count
    const aCompletedCount = a.results.filter(
      x =>
        x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
        x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE,
    ).length;
    const bCompletedCount = b.results.filter(
      x =>
        x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
        x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE,
    ).length;

    if (aCompletedCount !== bCompletedCount) {
      return bCompletedCount - aCompletedCount;
    }

    // 2. order criteria: ascending by the latest done timestamp
    if (aCompletedCount > 0) {
      const aLatestTimestamp = a.results
        .filter(x => !!x.submissionDoneTimestamp)
        .map(x => x.submissionDoneTimestamp!)
        .reduce((x, y) => (x > y ? x : y))
        .getTime();
      const bLatestTimestamp = b.results
        .filter(x => !!x.submissionDoneTimestamp)
        .map(x => x.submissionDoneTimestamp!)
        .reduce((x, y) => (x > y ? x : y))
        .getTime();

      if (aLatestTimestamp !== bLatestTimestamp) {
        return aLatestTimestamp - bLatestTimestamp;
      }
    }

    // 3. order criteria: ascending by cc name
    return a.countingCircle!.name.localeCompare(b.countingCircle!.name);
  }
}

export interface FilteredCountingCircleResults extends ResultOverviewCountingCircleResults {
  minResultState: CountingCircleResultState;
  isCorrected: boolean;
  filteredResults: ResultOverviewCountingCircleResult[];
  resultsByPoliticalBusinessId: Record<string, ResultOverviewCountingCircleResult>;
  resultsByPoliticalBusinessUnionId: Record<string, ResultOverviewCountingCircleResult[]>;
  resultsByCountingCircleId: Record<string, ResultOverviewCountingCircleResult[]>;
}
