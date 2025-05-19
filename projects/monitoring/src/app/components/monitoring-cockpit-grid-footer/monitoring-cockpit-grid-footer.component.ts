/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { SnackbarService } from '@abraxas/voting-lib';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  ContestCantonDefaults,
  CountingCircleResultState,
  DomainOfInfluenceType,
  flatten,
  MajorityElectionResultService,
  PoliticalBusinessUnion,
  ProportionalElectionResultService,
  SimplePoliticalBusiness,
  VoteResultService,
} from 'ausmittlung-lib';
import { FilteredCountingCircleResults } from '../monitoring-cockpit-grid/monitoring-cockpit-grid.component';

@Component({
  selector: 'app-monitoring-cockpit-grid-footer',
  templateUrl: './monitoring-cockpit-grid-footer.component.html',
  styleUrls: ['./monitoring-cockpit-grid-footer.component.scss'],
  standalone: false,
})
export class MonitoringCockpitGridFooterComponent {
  @Input()
  public filteredCountingCircleResults: FilteredCountingCircleResults[] = [];

  @Input()
  public countingCircleResults: FilteredCountingCircleResults[] = [];

  @Input()
  public filteredDomainOfInfluenceTypes: DomainOfInfluenceType[] = [];

  @Input()
  public filteredPoliticalBusinessesByDoiType: Record<number, SimplePoliticalBusiness[]> = [];

  @Input()
  public filteredPoliticalBusinessUnionsByDoiType: Record<number, PoliticalBusinessUnion[]> = [];

  @Input()
  public politicalBusinessUnionByPoliticalBusinessId: Record<string, PoliticalBusinessUnion> = {};

  @Input()
  public readOnly: boolean = true;

  @Input()
  public contestCantonDefaults?: ContestCantonDefaults;

  @Output()
  public loadingChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  private loadingValue: boolean = false;

  constructor(
    private readonly i18n: TranslateService,
    private readonly voteResultService: VoteResultService,
    private readonly proportionalElectionResultService: ProportionalElectionResultService,
    private readonly majorityElectionResultService: MajorityElectionResultService,
    private readonly toast: SnackbarService,
  ) {}

  public get loading(): boolean {
    return this.loadingValue;
  }

  public set loading(v: boolean) {
    this.loadingValue = v;
    this.loadingChange.emit(v);
  }

  public async updateAllStates(politicalBusinesses: SimplePoliticalBusiness[], newState: CountingCircleResultState): Promise<void> {
    this.loading = true;

    try {
      const resultsToUpdate = flatten(
        politicalBusinesses.map(politicalBusiness =>
          this.filteredCountingCircleResults
            .map(ccResult => ccResult.resultsByPoliticalBusinessId[politicalBusiness.id])
            .filter(result => !!result && result.state !== newState),
        ),
      );

      if (resultsToUpdate.length === 0) {
        this.loading = false;
        return;
      }

      const politicalBusinessType = politicalBusinesses[0].businessType;
      const resultIdsToUpdate = resultsToUpdate.map(result => result.id);

      switch (newState) {
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED:
          await this.plausibilise(politicalBusinessType, resultIdsToUpdate);
          break;
        case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY:
          await this.resetToAuditedTentatively(politicalBusinessType, resultIdsToUpdate);
          break;
      }

      for (const result of resultsToUpdate) {
        result.state = newState;
      }

      this.refreshMinResultState(this.filteredCountingCircleResults);

      this.toast.success(this.i18n.instant('APP.SAVED'));
    } finally {
      this.loading = false;
    }
  }

  private async plausibilise(businessType: PoliticalBusinessType, resultIdsToUpdate: string[]): Promise<void> {
    switch (businessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        await this.voteResultService.plausibilise(resultIdsToUpdate);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        await this.proportionalElectionResultService.plausibilise(resultIdsToUpdate);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION:
        await this.majorityElectionResultService.plausibilise(resultIdsToUpdate);
        break;
    }
  }

  private async resetToAuditedTentatively(businessType: PoliticalBusinessType, resultIdsToUpdate: string[]): Promise<void> {
    switch (businessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        await this.voteResultService.resetToAuditedTentatively(resultIdsToUpdate);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        await this.proportionalElectionResultService.resetToAuditedTentatively(resultIdsToUpdate);
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION:
        await this.majorityElectionResultService.resetToAuditedTentatively(resultIdsToUpdate);
        break;
    }
  }

  private refreshMinResultState(fccResults: FilteredCountingCircleResults[]): void {
    for (const fccResult of fccResults) {
      fccResult.minResultState = Math.min(...fccResult.filteredResults.map(x => x.state as number)) as CountingCircleResultState;
    }
  }
}
