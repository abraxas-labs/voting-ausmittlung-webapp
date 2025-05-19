/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContestSummary } from 'ausmittlung-lib';

@Component({
  selector: 'app-monitoring-contest-overview',
  templateUrl: './monitoring-contest-overview.component.html',
  styleUrls: ['./monitoring-contest-overview.component.scss'],
  standalone: false,
})
export class MonitoringContestOverviewComponent {
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  public async openDetail(contest: ContestSummary): Promise<void> {
    await this.router.navigate([contest.id], { relativeTo: this.route });
  }
}
