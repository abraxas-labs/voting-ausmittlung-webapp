/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthorizationService, Tenant } from '@abraxas/base-components';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import {
  CountingCircleResultState,
  PoliticalBusinessUnion,
  PoliticalBusinessUnionType,
  SimplePoliticalBusiness,
  flatten,
} from 'ausmittlung-lib';
import { FilteredCountingCircleResults } from '../../monitoring-cockpit-grid/monitoring-cockpit-grid.component';
import { ThemeService } from '@abraxas/voting-lib';

@Component({
  selector: 'app-monitoring-cockpit-grid-footer-buttons',
  templateUrl: './monitoring-cockpit-grid-footer-buttons.component.html',
  styleUrls: ['./monitoring-cockpit-grid-footer-buttons.component.scss'],
  standalone: false,
})
export class MonitoringCockpitGridFooterButtonsComponent implements OnInit, OnChanges {
  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;

  @Input()
  public politicalBusiness!: SimplePoliticalBusiness;

  @Input()
  public set politicalBusinessUnion(politicalBusinessUnion: PoliticalBusinessUnion) {
    this.politicalBusinessUnionValue = politicalBusinessUnion;

    if (!this.politicalBusiness) {
      this.politicalBusiness = this.politicalBusinessUnionValue.politicalBusinesses[0];
    }
  }

  @Input()
  public disabled: boolean = false;

  @Input()
  public countingCircleResults: FilteredCountingCircleResults[] = [];

  @Input()
  public filteredCountingCircleResults: FilteredCountingCircleResults[] = [];

  @Input()
  public readOnly: boolean = true;

  @Input()
  public stateDescriptionsByState: Record<number, string> = {};

  @Input()
  public statePlausibilisedDisabled: boolean = false;

  @Output()
  public updateAllStates: EventEmitter<CountingCircleResultState> = new EventEmitter<CountingCircleResultState>();

  public canResetAllToAuditedTentatively: boolean = false;
  public canPlausibiliseAll: boolean = false;
  public viewPartialResult: boolean = false;
  public politicalBusinessUnionValue?: PoliticalBusinessUnion;

  private tenant?: Tenant;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthorizationService,
    private readonly themeService: ThemeService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.tenant = await this.auth.getActiveTenant();
    this.updateAvailableButtons();
  }

  public ngOnChanges(): void {
    this.updateAvailableButtons();
  }

  public async navigateToResults(): Promise<void> {
    let routeKey = '';

    if (
      !!this.politicalBusinessUnionValue &&
      this.politicalBusinessUnionValue.type === PoliticalBusinessUnionType.POLITICAL_BUSINESS_UNION_TYPE_PROPORTIONAL_ELECTION
    ) {
      const extras =
        this.politicalBusinessUnionValue?.secureConnectId === this.tenant?.id ? undefined : { queryParams: { partialResult: true } };

      await this.router.navigate(
        [this.themeService.theme$.value, 'proportional-election-union-end-results', this.politicalBusinessUnionValue.id],
        extras,
      );
      return;
    }

    switch (this.politicalBusiness.businessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        routeKey = 'vote-end-results';
        break;
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        routeKey = 'proportional-election-end-results';
        break;
      default:
        routeKey = 'majority-election-end-results';
        break;
    }

    const extras =
      this.politicalBusiness.domainOfInfluence?.secureConnectId === this.tenant?.id ? undefined : { queryParams: { partialResult: true } };
    await this.router.navigate([this.themeService.theme$.value, routeKey, this.politicalBusiness.id], extras);
  }

  private updateAvailableButtons(): void {
    if (!this.filteredCountingCircleResults || !this.politicalBusiness || !this.countingCircleResults) {
      return;
    }

    this.canResetAllToAuditedTentatively =
      this.isResponsibleMonitorAuthority() &&
      flatten(
        this.filteredCountingCircleResults.map(ccResult =>
          !!this.politicalBusinessUnionValue
            ? (ccResult.resultsByPoliticalBusinessUnionId[this.politicalBusinessUnionValue.id] ?? [])
            : [ccResult.resultsByPoliticalBusinessId[this.politicalBusiness.id]],
        ),
      )
        .filter(r => !!r)
        .every(pbr => pbr.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED);

    this.updateCanPlausibiliseAll();
  }

  private isResponsibleMonitorAuthority(): boolean {
    if (!this.tenant) {
      return false;
    }

    if (!!this.politicalBusinessUnionValue) {
      return this.tenant.id === this.politicalBusinessUnionValue.secureConnectId;
    }

    return !!this.politicalBusiness.domainOfInfluence && this.tenant.id === this.politicalBusiness.domainOfInfluence.secureConnectId;
  }

  private updateCanPlausibiliseAll(): void {
    const hasNotCorrectedResultsInPoliticalBusiness = this.countingCircleResults.some(
      cc =>
        !cc.isCorrected &&
        (!!this.politicalBusinessUnionValue
          ? !!cc.resultsByPoliticalBusinessUnionId[this.politicalBusinessUnionValue.id]
          : !!cc.resultsByPoliticalBusinessId[this.politicalBusiness.id]),
    );
    const allPlausibilisedInPoliticalBusiness = flatten(
      this.countingCircleResults.map(cc =>
        !!this.politicalBusinessUnionValue
          ? (cc.resultsByPoliticalBusinessUnionId[this.politicalBusinessUnionValue.id] ?? [])
          : [cc.resultsByPoliticalBusinessId[this.politicalBusiness.id]],
      ),
    )
      .filter(r => !!r)
      .every(r => r.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED);

    this.canPlausibiliseAll = !hasNotCorrectedResultsInPoliticalBusiness && !allPlausibilisedInPoliticalBusiness;
  }
}
