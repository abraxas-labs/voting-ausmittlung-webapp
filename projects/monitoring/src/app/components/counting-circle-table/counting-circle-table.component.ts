/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FilterDirective, SortDirective, TableDataSource } from '@abraxas/base-components';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { CountingCircle, CountingCircleResultState, ResultOverviewCountingCircleResult } from 'ausmittlung-lib';

@Component({
  selector: 'app-counting-circle-table',
  templateUrl: './counting-circle-table.component.html',
  styleUrls: ['./counting-circle-table.component.scss'],
})
export class CountingCircleTableComponent implements OnInit, AfterViewInit {
  public readonly countingCircleResultState: typeof CountingCircleResultState = CountingCircleResultState;

  public readonly stateColumn = 'state';
  public readonly countingCircleColumn = 'countingCircle';
  public readonly receivedBallotsColumn = 'receivedBallots';
  public readonly blankBallotsColumn = 'blankBallots';
  public readonly invalidBallotsColumn = 'invalidBallots';
  public readonly accountedBallotsColumn = 'accountedBallots';

  public readonly columns = [
    this.stateColumn,
    this.countingCircleColumn,
    this.receivedBallotsColumn,
    this.blankBallotsColumn,
    this.invalidBallotsColumn,
    this.accountedBallotsColumn,
  ];

  @Input()
  public set countingCircles(data: ResultOverviewCountingCircleResult[]) {
    this.dataSource.data = data;
  }

  @Input()
  public countingCirclesById: Record<string, CountingCircle> = {};

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  public dataSource = new TableDataSource<ResultOverviewCountingCircleResult>();
  public stateList: EnumItemDescription<CountingCircleResultState>[] = [];

  constructor(
    private readonly enumUtil: EnumUtil,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.stateList = this.enumUtil.getArrayWithDescriptions<CountingCircleResultState>(
      CountingCircleResultState,
      'COUNTING_CIRCLE_RESULT_STATE.',
    );

    const dataAccessor = (data: ResultOverviewCountingCircleResult, filterId: string): string | number | Date => {
      if (filterId === this.countingCircleColumn) {
        return this.countingCirclesById[data.countingCircleId].name;
      }

      if (filterId === this.receivedBallotsColumn) {
        return data.countOfVoters?.totalReceivedBallots ?? 0;
      }

      if (filterId === this.blankBallotsColumn) {
        return data.countOfVoters?.totalBlankBallots ?? 0;
      }

      if (filterId === this.invalidBallotsColumn) {
        return data.countOfVoters?.totalInvalidBallots ?? 0;
      }

      if (filterId === this.accountedBallotsColumn) {
        return data.countOfVoters?.totalAccountedBallots ?? 0;
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

  public async openDetail(countingCircleId: string, politicalBusinessId: string): Promise<void> {
    await this.router.navigate([countingCircleId], {
      relativeTo: this.route,
      queryParams: {
        politicalBusinessId: politicalBusinessId,
      },
    });
  }
}
