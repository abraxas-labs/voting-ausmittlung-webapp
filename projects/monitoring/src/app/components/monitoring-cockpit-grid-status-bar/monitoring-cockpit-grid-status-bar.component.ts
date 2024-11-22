/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnChanges } from '@angular/core';
import { FilteredCountingCircleResults } from '../monitoring-cockpit-grid/monitoring-cockpit-grid.component';
import { groupBy, ResultOverviewCountingCircleResult } from 'ausmittlung-lib';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';

@Component({
  selector: 'app-monitoring-cockpit-grid-status-bar',
  templateUrl: './monitoring-cockpit-grid-status-bar.component.html',
  styleUrls: ['./monitoring-cockpit-grid-status-bar.component.scss'],
})
export class MonitoringCockpitGridStatusBarComponent implements OnChanges {
  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;

  @Input()
  public filteredCountingCircleResults: FilteredCountingCircleResults[] = [];

  @Input()
  public stateDescriptionsByState: Record<number, string> = {};

  @Input()
  public politicalBusinessId?: string;

  @Input()
  public politicalBusinessUnionId?: string;

  public resultsByState: Record<number, ResultOverviewCountingCircleResult[]> = {};
  public allStates: CountingCircleResultState[] = [
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION,
    CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY,
  ];

  public ngOnChanges(): void {
    if (this.filteredCountingCircleResults.length === 0 || (!this.politicalBusinessId && !this.politicalBusinessUnionId)) {
      return;
    }

    const results = this.filteredCountingCircleResults
      .map(x =>
        !this.politicalBusinessUnionId
          ? x.resultsByPoliticalBusinessId[this.politicalBusinessId!]
          : x.resultsByPoliticalBusinessUnionId[this.politicalBusinessUnionId!]?.reduce((x, y) => (x.state < y.state ? x : y)),
      )
      .filter(x => !!x);

    this.resultsByState = groupBy(
      results,
      x => x.state,
      x => x,
    );

    // state submission done and correction done should be displayed together
    this.resultsByState[CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE] = [
      ...(this.resultsByState[CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE] ?? []),
      ...(this.resultsByState[CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE] ?? []),
    ];
  }
}
