/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ProportionalElectionUnionResultService,
  DoubleProportionalResult,
  DoubleProportionalResultApportionmentState,
} from 'ausmittlung-lib';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-proportional-election-union-double-proportional-result',
  templateUrl: './proportional-election-union-double-proportional-result.component.html',
  styleUrls: ['./proportional-election-union-double-proportional-result.component.scss'],
})
export class ProportionalElectionUnionDoubleProportionalResultComponent implements OnDestroy {
  private readonly routeSubscription: Subscription;
  public readonly columns: string[] = [];

  public loading: boolean = false;
  public finalizing: boolean = false;
  public selectedStepIndex: number = 0;
  public doubleProportionalResult?: DoubleProportionalResult;
  public steps?: DoubleProportionalResultStep[];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: ProportionalElectionUnionResultService,
  ) {
    this.routeSubscription = this.route.params.subscribe(({ politicalBusinessUnionId }) => this.loadData(politicalBusinessUnionId));
  }

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
