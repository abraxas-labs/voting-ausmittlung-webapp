/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContestService,
  ContestSummary,
  SelectCountingCircleDialogComponent,
  SelectCountingCircleDialogData,
  SelectCountingCircleDialogResult,
} from 'ausmittlung-lib';

@Component({
  selector: 'app-erfassung-contest-overview',
  templateUrl: './erfassung-contest-overview.component.html',
  standalone: false,
})
export class ErfassungContestOverviewComponent {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialogService: DialogService,
    private readonly contestService: ContestService,
  ) {}

  public async openDetail(contest: ContestSummary): Promise<void> {
    const countingCircles = await this.contestService.getAccessibleCountingCircles(contest.id);
    if (countingCircles.length === 1) {
      await this.router.navigate([contest.id, countingCircles[0].id], { relativeTo: this.route });
      return;
    }

    const data: SelectCountingCircleDialogData = {
      countingCircles,
    };
    const result = await this.dialogService.openForResult<SelectCountingCircleDialogData, SelectCountingCircleDialogResult>(
      SelectCountingCircleDialogComponent,
      data,
    );

    if (result && result.selectedCountingCircle) {
      await this.router.navigate([contest.id, result.selectedCountingCircle.id], { relativeTo: this.route });
    }
  }
}
