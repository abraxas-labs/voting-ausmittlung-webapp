/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component, Input, OnChanges } from '@angular/core';
import { Contest, ContestState, CountingCircle } from '../../models';
import {
  ContestPastUnlockDialogComponent,
  ContestPastUnlockDialogData,
} from '../contest-past-unlock-dialog/contest-past-unlock-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';

@Component({
  selector: 'vo-ausm-contest-header',
  templateUrl: './contest-header.component.html',
  styleUrls: ['./contest-header.component.scss'],
})
export class ContestHeaderComponent implements OnChanges {
  @Input()
  public contest?: Contest;

  @Input()
  public countingCircle?: CountingCircle;

  @Input()
  public state?: CountingCircleResultState;

  @Input()
  public accessibleCountingCircles: CountingCircle[] = [];

  public readonly states: typeof ContestState = ContestState;

  public selectedCountingCircle?: CountingCircle;

  constructor(
    private readonly dialog: DialogService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  public ngOnChanges(): void {
    if (!this.countingCircle || this.accessibleCountingCircles.length === 0 || !this.contest) {
      return;
    }

    if (this.accessibleCountingCircles.length === 1) {
      this.selectedCountingCircle = this.accessibleCountingCircles[0];
      return;
    }

    this.selectedCountingCircle = this.accessibleCountingCircles.find(x => x.id === this.countingCircle!.id);
  }

  public openPastUnlockDialog(): void {
    if (!this.contest) {
      return;
    }

    const dialogData: ContestPastUnlockDialogData = {
      contest: this.contest,
    };

    this.dialog.open(ContestPastUnlockDialogComponent, dialogData);
  }

  public async countingCircleChanged(countingCircle?: CountingCircle): Promise<void> {
    if (!countingCircle || !this.selectedCountingCircle || countingCircle.id === this.selectedCountingCircle.id) {
      return;
    }

    delete this.countingCircle;
    delete this.contest;
    delete this.selectedCountingCircle;

    await this.router.navigate(['..', countingCircle.id], { relativeTo: this.route });
  }
}
