/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnInit } from '@angular/core';
import { SimplePoliticalBusiness } from '../../../../../ausmittlung-lib/src/lib/models';
import {
  CountingCircleResultState,
  flatten,
  groupBy,
  groupBySingle,
  ResultOverview,
  ResultOverviewCountingCircleResult,
  ResultOverviewCountingCircleWithDetails,
} from 'ausmittlung-lib';

@Component({
  selector: 'app-monitoring-political-businesses-overview',
  templateUrl: './monitoring-political-businesses-overview.component.html',
  styleUrls: ['./monitoring-political-businesses-overview.component.scss'],
  standalone: false,
})
export class MonitoringPoliticalBusinessesOverviewComponent implements OnInit {
  @Input()
  public resultOverview?: ResultOverview;

  public politicalBusinesses: SimplePoliticalBusinessOverview[] = [];
  public countingCircles: ResultOverviewCountingCircleResult[] = [];

  public countingCircleResultsByPoliticalBusinessId: Record<string, ResultOverviewCountingCircleResult[]> = {};
  public countingCirclesById: Record<string, ResultOverviewCountingCircleWithDetails> = {};

  public allFieldsPoliticalBusinessTableActive: boolean = true;

  public async ngOnInit(): Promise<void> {
    if (!this.resultOverview) {
      return;
    }

    this.countingCircleResultsByPoliticalBusinessId = groupBy(
      flatten(this.resultOverview.countingCircleResults.map(r => r.results)),
      x => x.politicalBusinessId,
      x => x,
    );

    this.politicalBusinesses = this.resultOverview.politicalBusinesses
      .sort((a, b) => (a.domainOfInfluence?.type ?? 0) - (b.domainOfInfluence?.type ?? 0))
      .map(x => ({
        ...x,
        amountOfCountingCircles: this.countingCircleResultsByPoliticalBusinessId[x.id].length,
        minState: this.getMinPoliticalBusinessState(this.countingCircleResultsByPoliticalBusinessId[x.id]),
      }));

    this.countingCirclesById = groupBySingle(
      this.resultOverview.countingCircleResults,
      x => x.countingCircleWithDetails.countingCircle.id,
      x => x.countingCircleWithDetails,
    );
  }

  public openCountingCircleResults(simplePoliticalBusiness: SimplePoliticalBusiness): void {
    this.countingCircles = this.countingCircleResultsByPoliticalBusinessId[simplePoliticalBusiness.id];
  }

  private getMinPoliticalBusinessState(ccResults: ResultOverviewCountingCircleResult[]): CountingCircleResultState {
    return Math.min(...ccResults.map(x => x.state as number)) as CountingCircleResultState;
  }
}

export type SimplePoliticalBusinessOverview = SimplePoliticalBusiness & {
  amountOfCountingCircles: number;
  minState: CountingCircleResultState;
};
