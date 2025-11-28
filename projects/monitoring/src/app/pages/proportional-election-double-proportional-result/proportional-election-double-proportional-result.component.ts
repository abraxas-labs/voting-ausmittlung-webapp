/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DoubleProportionalResult,
  DoubleProportionalResultApportionmentState,
  HasDeactivate,
  HasUnsavedChanges,
  ProportionalElectionResultService,
} from 'ausmittlung-lib';
import { Subscription } from 'rxjs';
import { DoubleProportionalResultSuperApportionmentComponent } from '../../components/double-proportional-result-super-apportionment/double-proportional-result-super-apportionment.component';

@Component({
  selector: 'app-proportional-election-double-proportional-result',
  templateUrl: './proportional-election-double-proportional-result.component.html',
  standalone: false,
})
export class ProportionalElectionDoubleProportionalResultComponent implements OnDestroy, HasDeactivate {
  private readonly routeSubscription: Subscription;
  public readonly columns: string[] = [];

  public loading: boolean = false;
  public finalizing: boolean = false;
  public doubleProportionalResult?: DoubleProportionalResult;

  public deactivateTitle: string = 'DOUBLE_PROPORTIONAL_RESULT.CLOSE_WITH_OPEN_REQUIRED_LOT_DECISIONS_CONFIRM.TITLE';
  public deactivateMessage: string = 'DOUBLE_PROPORTIONAL_RESULT.CLOSE_WITH_OPEN_REQUIRED_LOT_DECISIONS_CONFIRM.DESCRIPTION';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: ProportionalElectionResultService,
  ) {
    this.routeSubscription = this.route.params.subscribe(({ politicalBusinessId }) => this.loadData(politicalBusinessId));
  }

  public get showDeactivateMessage(): boolean {
    return (
      this.doubleProportionalResult?.superApportionmentState ===
        DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_HAS_OPEN_LOT_DECISION ||
      (!!this.superApportionment?.lotDecision &&
        (this.superApportionment.lotDecision.newLotDecisionSelected === true || !this.superApportionment.lotDecision.selectedLotDecision))
    );
  }

  @ViewChild(DoubleProportionalResultSuperApportionmentComponent)
  public superApportionment?: DoubleProportionalResultSuperApportionmentComponent;

  public async loadData(politicalBusinessId: string): Promise<void> {
    this.loading = true;
    try {
      this.doubleProportionalResult = await this.resultService.getDoubleProportionalResult(politicalBusinessId);
    } finally {
      this.loading = false;
    }
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
