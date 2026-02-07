/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SegmentedControl } from '@abraxas/base-components';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContestCantonDefaults,
  CountingCircle,
  CountingCircleResultState,
  distinct,
  DomainOfInfluenceType,
  EventLogService,
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
  ResultStateChangeEvent,
  SimplePoliticalBusiness,
  VoteResultService,
} from 'ausmittlung-lib';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizationService, FilterDirective, SortDirective, TableDataSource, Tenant } from '@abraxas/base-components';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { StorageService } from '../../services/storage.service';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';

@Component({
  selector: 'app-monitoring-cockpit-grid',
  templateUrl: './monitoring-cockpit-grid.component.html',
  styleUrls: ['./monitoring-cockpit-grid.component.scss'],
  standalone: false,
})
export class MonitoringCockpitGridComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly eventLogService = inject(EventLogService);
  private readonly resultService = inject(ResultService);
  private readonly i18n = inject(TranslateService);
  private readonly auth = inject(AuthorizationService);
  private readonly voteResultService = inject(VoteResultService);
  private readonly proportionalElectionResultService = inject(ProportionalElectionResultService);
  private readonly majorityElectionResultService = inject(MajorityElectionResultService);
  private readonly storageService = inject(StorageService);

  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;
  public readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  public readonly stateColumn = 'state';
  public readonly countingCircleColumn = 'countingCircle';
  public readonly notOwnedPoliticalBusinessColumn = 'notOwnedPoliticalBusiness';

  public readonly emptySubHeaderColumn = 'empty';
  public readonly politicalBusinessColumnPrefix = 'id-';
  public readonly statusBarColumnPrefix = 'status-bar-';

  private readonly toCheckStates: CountingCircleResultState[] = [
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_INITIAL,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE,
  ];
  private readonly checkedStates: CountingCircleResultState[] = [
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED,
  ];
  private readonly emptyStates: CountingCircleResultState[] = [];

  @Input()
  public manualPublishResultsEnabled: boolean = false;

  @Input()
  public publishResultsBeforeAuditedTentatively: boolean = false;

  @Input()
  public resultOverview?: ResultOverview;

  @ViewChild(SortDirective)
  public sort!: SortDirective;

  @ViewChild(FilterDirective)
  public filter!: FilterDirective;

  public dataSource = new TableDataSource<FilteredCountingCircleResults>();
  public columns: string[] = [];
  public subHeaderColumns: string[] = [];
  public stateList: EnumItemDescription<CountingCircleResultState>[] = [];
  public allDoiTypeFilters: SegmentedControl[] = [];
  public doiTypeFilter: DomainOfInfluenceType[];
  public readOnly: boolean = true;

  public filteredPoliticalBusinesses: SimplePoliticalBusiness[] = [];
  public filteredPoliticalBusinessUnions: PoliticalBusinessUnion[] = [];
  public filteredCountingCircleResults: FilteredCountingCircleResults[] = [];

  public countingCircleResults: FilteredCountingCircleResults[] = [];

  public politicalBusinessUnionByPoliticalBusinessId: Record<string, PoliticalBusinessUnion> = {};
  public politicalBusinessUnions: PoliticalBusinessUnion[] = [];

  public contestCantonDefaults?: ContestCantonDefaults;
  public allStateFilters: SegmentedControl[] = [];
  public stateFilter: CountingCircleResultState[];
  public toCheckStateFilterIsSelected: boolean = false;

  public publishing: boolean = false;

  private politicalBusinesses: SimplePoliticalBusiness[] = [];
  public notOwnedPoliticalBusinessIds: string[] = [];

  private resultsById: Record<
    string,
    { result: ResultOverviewCountingCircleResult; countingCircleResults: FilteredCountingCircleResults }
  > = {};

  private contestId: string = '';
  private tenant?: Tenant;

  private watchStateSubscription?: Subscription;

  constructor() {
    const enumUtil = inject(EnumUtil);

    this.doiTypeFilter = this.storageService.getDoiTypeFilter() ?? [];
    this.stateFilter = this.mapValueToStateFilter(this.storageService.getStateFilter() ?? this.storageService.stateFilterAll);
    this.stateList = enumUtil.getArrayWithDescriptions<CountingCircleResultState>(
      CountingCircleResultState,
      'COUNTING_CIRCLE_RESULT_STATE.',
    );
  }

  public async ngOnInit(): Promise<void> {
    this.tenant = await this.auth.getActiveTenant();

    if (!this.resultOverview) {
      return;
    }

    this.watchStateSubscription?.unsubscribe();

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
    this.setCountingCircleResults();

    this.resultsById = groupBySingle(
      flatten(this.countingCircleResults.map(r => r.results.map(x => ({ result: x, countingCircleResults: r })))),
      x => x.result.id,
      x => x,
    );

    this.updateFilters();
    this.startChangesListener();
    this.updateStateFilters();
    this.createDoiTypeFilters();
    this.updateTable();
    this.initTableSortAndFilterAccessors();
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  public ngOnDestroy(): void {
    this.watchStateSubscription?.unsubscribe();
  }

  public updateFilters(): void {
    this.updateFilteredPoliticalBusinesses();
    this.updateFilteredPoliticalBusinessUnions();
    this.updateFilteredCountingCircleResults();
    this.removeUnneededPoliticalBusiness();
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
    this.stateFilter = states;
    this.storageService.storeStateFilter(this.mapStateFilterToValue());
    this.updateFilters();
    this.updateTable();

    this.toCheckStateFilterIsSelected =
      this.stateFilter.length === this.toCheckStates.length && this.stateFilter.every((f, i) => this.toCheckStates[i]);
  }

  public doiTypeFilterSelected(doiTypes: DomainOfInfluenceType[]): void {
    this.doiTypeFilter = doiTypes;
    this.storageService.storeDoiTypeFilter(doiTypes);
    this.updateFilters();
    this.updateTable();
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

  private startChangesListener(): void {
    if (!this.contestId || !this.resultService || this.readOnly) {
      return;
    }

    this.watchStateSubscription?.unsubscribe();
    this.watchStateSubscription = this.eventLogService.watchResultState(this.contestId).subscribe(e => this.handleResultStateChange(e));
  }

  private updateState(id: string, newState: CountingCircleResultState, timestamp: Date): void {
    const { result, countingCircleResults } = this.resultsById[id] || {};
    if (!result || result.state === newState) {
      return;
    }

    result.state = newState;

    countingCircleResults.minResultState = this.getMinResultState(countingCircleResults);
    switch (result.state) {
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING:
        result.submissionDoneTimestamp = undefined;
        result.readyForCorrectionTimestamp = undefined;
        result.auditedTentativelyTimestamp = undefined;
        result.plausibilisedTimestamp = undefined;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION:
        result.submissionDoneTimestamp = undefined;
        result.readyForCorrectionTimestamp = timestamp;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE:
        result.submissionDoneTimestamp = timestamp;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE:
        result.submissionDoneTimestamp = timestamp;
        result.readyForCorrectionTimestamp = undefined;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY:
        result.auditedTentativelyTimestamp = timestamp;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED:
        result.plausibilisedTimestamp = timestamp;
        break;
    }

    this.setCountingCircleResults();
    this.updateFilters();
    this.updateStateFilters();
    this.updateTable();
  }

  private sortFilteredCountingCircleResults(): void {
    this.filteredCountingCircleResults = this.filteredCountingCircleResults.sort((a, b) =>
      this.filteredCountingCircleResultsComparer(a, b, this.notOwnedPoliticalBusinessIds),
    );
  }

  private setCountingCircleResults(): void {
    if (!this.resultOverview) {
      return;
    }

    this.countingCircleResults = this.resultOverview.countingCircleResults.map(x => ({
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
    if (!this.doiTypeFilter) {
      this.filteredPoliticalBusinesses = this.politicalBusinesses;
      return;
    }

    this.filteredPoliticalBusinesses = this.politicalBusinesses.filter(x => this.doiTypeFilter.includes(x.domainOfInfluence!.type));
  }

  private updateFilteredPoliticalBusinessUnions(): void {
    if (!this.doiTypeFilter) {
      this.filteredPoliticalBusinessUnions = this.politicalBusinessUnions;
      return;
    }

    this.filteredPoliticalBusinessUnions = this.politicalBusinessUnions.filter(x =>
      this.doiTypeFilter.includes(x.politicalBusinesses[0].domainOfInfluence!.type),
    );
  }

  private updateFilteredCountingCircleResults(): void {
    this.filteredCountingCircleResults = this.countingCircleResults;
    for (const cc of this.filteredCountingCircleResults) {
      cc.filteredResults = this.filteredPoliticalBusinesses
        .concat(flatten(this.filteredPoliticalBusinessUnions.map(x => x.politicalBusinesses)))
        .map(pb => cc.resultsByPoliticalBusinessId[pb.id])
        .filter(r => !!r);
      cc.isCorrected = cc.filteredResults.every(y => this.checkedStates.includes(y.state));
    }

    this.filteredCountingCircleResults = this.filteredCountingCircleResults.filter(
      x => this.stateFilter.length === 0 || this.stateFilter.includes(x.minResultState),
    );

    this.sortFilteredCountingCircleResults();
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

  private getMinResultState(ccResults: ResultOverviewCountingCircleResults): CountingCircleResultState {
    return Math.min(
      ...ccResults.results.filter(r => !this.notOwnedPoliticalBusinessIds.includes(r.politicalBusinessId)).map(x => x.state as number),
    ) as CountingCircleResultState;
  }

  private filteredCountingCircleResultsComparer(
    a: FilteredCountingCircleResults,
    b: FilteredCountingCircleResults,
    notOwnedPoliticalBusinessIds: string[],
  ): number {
    // 1. order criteria: descending ResultState.Done count
    const aCompletedCount = a.filteredResults.filter(
      x =>
        !notOwnedPoliticalBusinessIds.includes(x.politicalBusinessId) &&
        (x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
          x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE),
    ).length;
    const bCompletedCount = b.filteredResults.filter(
      x =>
        !notOwnedPoliticalBusinessIds.includes(x.politicalBusinessId) &&
        (x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
          x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE),
    ).length;

    if (aCompletedCount !== bCompletedCount) {
      return bCompletedCount - aCompletedCount;
    }

    // 2. order criteria: ascending by the latest done timestamp
    if (aCompletedCount > 0) {
      const aLatestTimestamp = a.filteredResults
        .filter(x => !notOwnedPoliticalBusinessIds.includes(x.politicalBusinessId) && !!x.submissionDoneTimestamp)
        .map(x => x.submissionDoneTimestamp!)
        .reduce((x, y) => (x > y ? x : y))
        .getTime();
      const bLatestTimestamp = b.filteredResults
        .filter(x => !notOwnedPoliticalBusinessIds.includes(x.politicalBusinessId) && !!x.submissionDoneTimestamp)
        .map(x => x.submissionDoneTimestamp!)
        .reduce((x, y) => (x > y ? x : y))
        .getTime();

      if (aLatestTimestamp !== bLatestTimestamp) {
        return aLatestTimestamp - bLatestTimestamp;
      }
    }

    // 3. order criteria: ascending by cc name
    return a.countingCircleWithDetails.countingCircle!.name.localeCompare(b.countingCircleWithDetails.countingCircle!.name);
  }

  private updateStateFilters(): void {
    const relevantCountingCircleResults = this.countingCircleResults.filter(cc => cc.filteredResults.length > 0);
    const countCorrected = relevantCountingCircleResults.filter(cc => cc.isCorrected).length;
    const countNotCorrected = relevantCountingCircleResults.length - countCorrected;

    this.allStateFilters = [
      {
        displayText: this.i18n.instant('MONITORING_COCKPIT.FILTER_STATE.ALL'),
        value: this.emptyStates,
        disabled: false,
      },
      {
        displayText: this.i18n.instant('MONITORING_COCKPIT.FILTER_STATE.TO_CHECK', { count: countNotCorrected }),
        value: this.toCheckStates,
        disabled: false,
      },
      {
        displayText: this.i18n.instant('MONITORING_COCKPIT.FILTER_STATE.CHECKED', { count: countCorrected }),
        value: this.checkedStates,
        disabled: false,
      },
    ];
  }

  private mapStateFilterToValue(): string {
    switch (this.stateFilter) {
      case this.toCheckStates:
        return this.storageService.stateFilterToCheck;
      case this.checkedStates:
        return this.storageService.stateFilterChecked;
      case this.emptyStates:
        return this.storageService.stateFilterAll;
      default:
        throw new Error('Invalid state filter value');
    }
  }
  private mapValueToStateFilter(value: string): CountingCircleResultState[] {
    switch (value) {
      case this.storageService.stateFilterToCheck:
        return this.toCheckStates;
      case this.storageService.stateFilterChecked:
        return this.checkedStates;
      case this.storageService.stateFilterAll:
        return this.emptyStates;
      default:
        throw new Error('Invalid state filter');
    }
  }

  private async handleResultStateChange(e: ResultStateChangeEvent): Promise<void> {
    if (e.isReconnect) {
      await this.reloadAllStates();
      return;
    }

    this.updateState(e.event.aggregateId, e.newState, e.event.timestamp);
  }

  private async reloadAllStates() {
    const data = await this.resultService.getOverview(this.contestId);
    for (const countingCircleResult of data.countingCircleResults) {
      for (const result of countingCircleResult.results) {
        this.updateState(result.id, result.state, new Date());
      }
    }
  }

  private updateTable(): void {
    this.dataSource.data = this.filteredCountingCircleResults;

    this.columns = [
      this.stateColumn,
      this.countingCircleColumn,
      ...this.filteredPoliticalBusinesses.map(x => this.politicalBusinessColumnPrefix + x.id),
      ...this.filteredPoliticalBusinessUnions.map(x => this.politicalBusinessColumnPrefix + x.id),
    ];
    this.subHeaderColumns = [
      this.emptySubHeaderColumn,
      this.emptySubHeaderColumn,
      ...this.filteredPoliticalBusinesses.map(x => this.statusBarColumnPrefix + x.id),
      ...this.filteredPoliticalBusinessUnions.map(x => this.statusBarColumnPrefix + x.id),
    ];
    if (
      this.notOwnedPoliticalBusinessIds.length > 0 &&
      this.stateFilter.length === 0 &&
      this.doiTypeFilter.includes(DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU)
    ) {
      this.columns = [...this.columns, this.notOwnedPoliticalBusinessColumn];
      this.subHeaderColumns = [...this.subHeaderColumns, this.emptySubHeaderColumn];
    }
  }

  private getResultForColumn(data: FilteredCountingCircleResults, columnId: string): ResultOverviewCountingCircleResult | undefined {
    for (const politicalBusiness of this.filteredPoliticalBusinesses) {
      if (columnId === this.politicalBusinessColumnPrefix + politicalBusiness.id) {
        return data.resultsByPoliticalBusinessId[politicalBusiness.id];
      }
    }

    for (const politicalBusinessUnion of this.filteredPoliticalBusinessUnions) {
      if (columnId === this.politicalBusinessColumnPrefix + politicalBusinessUnion.id) {
        const results = data.resultsByPoliticalBusinessUnionId[politicalBusinessUnion.id];
        return results?.reduce((x, y) => (x.state < y.state ? x : y));
      }
    }
  }

  private createDoiTypeFilters(): void {
    this.allDoiTypeFilters = distinct(
      this.politicalBusinesses
        .map(x => x.domainOfInfluence!.type as DomainOfInfluenceType)
        .concat(this.politicalBusinessUnions.map(x => x.politicalBusinesses[0].domainOfInfluence!.type as DomainOfInfluenceType)),
      x => x,
    ).map(x => ({
      displayText: this.i18n.instant('DOMAIN_OF_INFLUENCE_TYPES.' + x),
      value: x,
      disabled: false,
    }));

    if (this.notOwnedPoliticalBusinessIds.length > 0) {
      this.allDoiTypeFilters.push({
        displayText: this.i18n.instant('DOMAIN_OF_INFLUENCE_TYPES.' + DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU),
        value: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU,
        disabled: false,
      });
    }

    // if no doi type filter is stored in the session, all doi types should be active
    if (this.doiTypeFilter.length === 0) {
      this.doiTypeFilter = this.allDoiTypeFilters.map(x => x.value);
    }
  }

  private initTableSortAndFilterAccessors(): void {
    const baseDataAccessor = (data: FilteredCountingCircleResults, columnId: string): string | number | Date => {
      if (columnId === this.stateColumn) {
        return data.minResultState;
      }

      if (columnId === this.countingCircleColumn) {
        return data.countingCircleWithDetails.countingCircle.name ?? '';
      }

      if (columnId === this.notOwnedPoliticalBusinessColumn) {
        const results = data.resultsByCountingCircleId[data.countingCircleWithDetails.countingCircle.id];
        if (!results) {
          return '';
        }
        return this.i18n.instant('MONITORING_COCKPIT.NOT_OWNED_POLITICAL_BUSINESS.' + (results.length > 1 ? 'MULTIPLE' : 'SINGLE'), {
          count: results.length,
        });
      }

      return (data as Record<string, any>)[columnId] ?? '';
    };

    const filterDataAccessor = (data: FilteredCountingCircleResults, columnId: string): string | number | Date => {
      const result = this.getResultForColumn(data, columnId);
      if (result) {
        return result.state;
      }

      return baseDataAccessor(data, columnId);
    };

    const sortDataAccessor = (data: FilteredCountingCircleResults, columnId: string): string | number | Date => {
      const result = this.getResultForColumn(data, columnId);
      if (result) {
        if (result.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY) {
          return result.state + '' + result.auditedTentativelyTimestamp!.getTime();
        }

        if (result.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED) {
          return result.state + '' + result.plausibilisedTimestamp!.getTime();
        }

        if (result.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION) {
          return result.state + '' + result.readyForCorrectionTimestamp!.getTime();
        }

        if (
          result.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
          result.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE
        ) {
          return result.state + '' + result.submissionDoneTimestamp!.getTime();
        }

        return result.state;
      }

      return baseDataAccessor(data, columnId);
    };

    this.dataSource.filterDataAccessor = filterDataAccessor;
    this.dataSource.sortingDataAccessor = sortDataAccessor;
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
