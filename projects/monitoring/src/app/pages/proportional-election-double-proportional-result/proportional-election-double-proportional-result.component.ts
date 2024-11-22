/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DoubleProportionalResult, ProportionalElectionResultService } from 'ausmittlung-lib';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-proportional-election-double-proportional-result',
  templateUrl: './proportional-election-double-proportional-result.component.html',
})
export class ProportionalElectionDoubleProportionalResultComponent implements OnDestroy {
  private readonly routeSubscription: Subscription;
  public readonly columns: string[] = [];

  public loading: boolean = false;
  public finalizing: boolean = false;
  public doubleProportionalResult?: DoubleProportionalResult;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resultService: ProportionalElectionResultService,
  ) {
    this.routeSubscription = this.route.params.subscribe(({ politicalBusinessId }) => this.loadData(politicalBusinessId));
  }

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
