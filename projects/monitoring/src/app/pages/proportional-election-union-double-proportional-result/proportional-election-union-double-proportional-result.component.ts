/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ProportionalElectionUnionResultService,
  DoubleProportionalResult,
  DoubleProportionalResultApportionmentState,
  HasDeactivate,
} from 'ausmittlung-lib';
import { Subscription } from 'rxjs';
import { DoubleProportionalResultSuperApportionmentComponent } from '../../components/double-proportional-result-super-apportionment/double-proportional-result-super-apportionment.component';
import { DoubleProportionalResultSubApportionmentComponent } from '../../components/double-proportional-result-sub-apportionment/double-proportional-result-sub-apportionment.component';

@Component({
  selector: 'app-proportional-election-union-double-proportional-result',
  templateUrl: './proportional-election-union-double-proportional-result.component.html',
  styleUrls: ['./proportional-election-union-double-proportional-result.component.scss'],
  standalone: false,
})
export class ProportionalElectionUnionDoubleProportionalResultComponent implements OnDestroy, HasDeactivate {
  private readonly routeSubscription: Subscription;
  public readonly columns: string[] = [];

  public loading: boolean = false;
  public finalizing: boolean = false;
  public selectedStepIndex: number = 0;
  public doubleProportionalResult?: DoubleProportionalResult;
  public steps?: DoubleProportionalResultStep[];

  public deactivateTitle: string = 'DOUBLE_PROPORTIONAL_RESULT.CLOSE_WITH_OPEN_REQUIRED_LOT_DECISIONS_CONFIRM.TITLE';
  public deactivateMessage: string = 'DOUBLE_PROPORTIONAL_RESULT.CLOSE_WITH_OPEN_REQUIRED_LOT_DECISIONS_CONFIRM.DESCRIPTION';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: ProportionalElectionUnionResultService,
  ) {
    this.routeSubscription = this.route.params.subscribe(({ politicalBusinessUnionId }) => this.loadData(politicalBusinessUnionId));
  }

  public get showDeactivateMessage(): boolean {
    return (
      this.doubleProportionalResult?.superApportionmentState ===
        DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_HAS_OPEN_LOT_DECISION ||
      this.doubleProportionalResult?.subApportionmentState ===
        DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_HAS_OPEN_LOT_DECISION ||
      (!!this.superApportionment?.lotDecision &&
        (this.superApportionment.lotDecision.newLotDecisionSelected === true ||
          !this.superApportionment.lotDecision.selectedLotDecision)) ||
      (!!this.subApportionment?.lotDecision &&
        (this.subApportionment.lotDecision.newLotDecisionSelected === true || !this.subApportionment.lotDecision.selectedLotDecision))
    );
  }

  @ViewChild(DoubleProportionalResultSuperApportionmentComponent)
  public superApportionment?: DoubleProportionalResultSuperApportionmentComponent;

  @ViewChild(DoubleProportionalResultSubApportionmentComponent)
  public subApportionment?: DoubleProportionalResultSubApportionmentComponent;

  public async loadData(politicalBusinessUnionId: string): Promise<void> {
    this.loading = true;
    try {
      this.doubleProportionalResult = await this.resultService.getDoubleProportionalResult(politicalBusinessUnionId);
      this.updateSteps();
    } finally {
      this.loading = false;
    }
  }

  public handleApportionmentUpdate() {
    this.updateSteps();
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  private updateSteps(): void {
    if (!this.doubleProportionalResult) {
      return;
    }

    this.steps = [
      {
        label: 'DOUBLE_PROPORTIONAL_RESULT.SUPER_APPORTIONMENT.TITLE',
        hasError:
          this.doubleProportionalResult.superApportionmentState !==
          DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_COMPLETED,
      },
      {
        label: 'DOUBLE_PROPORTIONAL_RESULT.SUB_APPORTIONMENT.TITLE',
        hasError:
          this.doubleProportionalResult.subApportionmentState !==
          DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_COMPLETED,
      },
    ];
  }
}

interface DoubleProportionalResultStep {
  label: string;
  hasError: boolean;
}
