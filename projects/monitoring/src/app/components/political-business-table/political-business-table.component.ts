/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FilterDirective, SortDirective, TableDataSource } from '@abraxas/base-components';
import { SimplePoliticalBusinessOverview } from '../monitoring-political-businesses-overview/monitoring-political-businesses-overview.component';
import { DomainOfInfluenceType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/domain_of_influence_pb';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-political-business-table',
  templateUrl: './political-business-table.component.html',
  styleUrls: ['./political-business-table.component.scss'],
})
export class PoliticalBusinessTableComponent implements OnInit, AfterViewInit {
  public readonly minStateColumn = 'minState';
  public readonly domainOfInfluenceTypeColumn = 'domainOfInfluenceType';
  public readonly businessTypeColumn = 'businessType';
  public readonly politicalBusinessNumberColumn = 'politicalBusinessNumber';
  public readonly shortDescriptionColumn = 'shortDescription';
  public readonly amountOfCountingCirclesColumn = 'amountOfCountingCircles';
  public readonly domainOfInfluenceColumn = 'domainOfInfluence';

  public readonly columns = [
    this.minStateColumn,
    this.domainOfInfluenceTypeColumn,
    this.businessTypeColumn,
    this.politicalBusinessNumberColumn,
    this.shortDescriptionColumn,
    this.amountOfCountingCirclesColumn,
    this.domainOfInfluenceColumn,
  ];

  @Input()
  public set politicalBusinesses(data: SimplePoliticalBusinessOverview[]) {
    this.dataSource.data = data;
  }

  @Output()
  public politicalBusinessSelected: EventEmitter<SimplePoliticalBusinessOverview> = new EventEmitter<SimplePoliticalBusinessOverview>();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  public dataSource = new TableDataSource<SimplePoliticalBusinessOverview>();
  public stateList: EnumItemDescription<CountingCircleResultState>[] = [];
  public domainOfInfluenceTypeList: EnumItemDescription<DomainOfInfluenceType>[] = [];
  public politicalBusinessTypeList: EnumItemDescription<PoliticalBusinessType>[] = [];

  constructor(
    private readonly enumUtil: EnumUtil,
    private readonly i18n: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.stateList = this.enumUtil.getArrayWithDescriptions<CountingCircleResultState>(
      CountingCircleResultState,
      'COUNTING_CIRCLE_RESULT_STATE.',
    );
    this.domainOfInfluenceTypeList = this.enumUtil.getArrayWithDescriptions<DomainOfInfluenceType>(
      DomainOfInfluenceType,
      'DOMAIN_OF_INFLUENCE_TYPES.',
    );
    this.politicalBusinessTypeList = [
      {
        description: this.i18n.instant(
          'MONITORING_POLITICAL_BUSINESSES_OVERVIEW.POLITICAL_BUSINESS_TYPE.' + PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE,
        ),
        value: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE,
      },
      {
        description: this.i18n.instant(
          'MONITORING_POLITICAL_BUSINESSES_OVERVIEW.POLITICAL_BUSINESS_TYPE.' +
            PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION,
        ),
        value: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION,
      },
      {
        description: this.i18n.instant(
          'MONITORING_POLITICAL_BUSINESSES_OVERVIEW.POLITICAL_BUSINESS_TYPE.' +
            PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION,
        ),
        value: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION,
      },
    ];

    const dataAccessor = (data: SimplePoliticalBusinessOverview, filterId: string): string | number | Date => {
      if (filterId === this.domainOfInfluenceColumn) {
        return data.domainOfInfluence?.name ?? '';
      }

      if (filterId === this.domainOfInfluenceTypeColumn) {
        return data.domainOfInfluence?.type ?? 0;
      }

      return (data as Record<string, any>)[filterId] ?? '';
    };

    this.dataSource.filterDataAccessor = dataAccessor;
    this.dataSource.sortingDataAccessor = dataAccessor;
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }
}
