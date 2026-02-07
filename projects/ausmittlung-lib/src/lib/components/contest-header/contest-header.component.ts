/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { Contest, ContestState, CountingCircle, PoliticalBusiness } from '../../models';
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
  standalone: false,
})
export class ContestHeaderComponent implements OnChanges {
  private readonly dialog = inject(DialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @Input()
  public contest?: Contest;

  @Input()
  public countingCircle?: CountingCircle;

  @Input()
  public politicalBusiness?: PoliticalBusiness;

  @Input()
  public state?: CountingCircleResultState;

  @Input()
  public accessibleCountingCircles: CountingCircle[] = [];

  @Input()
  public accessiblePoliticalBusinesses: PoliticalBusiness[] = [];

  public readonly states: typeof ContestState = ContestState;

  public selectedCountingCircle?: CountingCircle;
  public selectedPoliticalBusiness?: PoliticalBusiness;

  public politicalBusinessDisplayExpr: (pb: PoliticalBusiness) => string = (pb: PoliticalBusiness) => pb.domainOfInfluence!.name;

  public ngOnChanges(): void {
    this.updateCountingCircles();
    this.updatePoliticalBusinesses();
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

  public async politicalBusinessChanged(politicalBusiness?: PoliticalBusiness): Promise<void> {
    if (!politicalBusiness || !this.selectedPoliticalBusiness || politicalBusiness.id === this.selectedPoliticalBusiness.id) {
      return;
    }

    delete this.politicalBusiness;
    delete this.contest;
    delete this.selectedPoliticalBusiness;

    await this.router.navigate(['..', politicalBusiness.id], { relativeTo: this.route });
  }

  private updateCountingCircles(): void {
    if (!this.countingCircle || this.accessibleCountingCircles.length === 0) {
      return;
    }

    if (this.accessibleCountingCircles.length === 1) {
      this.selectedCountingCircle = this.accessibleCountingCircles[0];
      return;
    }

    this.selectedCountingCircle = this.accessibleCountingCircles.find(x => x.id === this.countingCircle!.id);
  }

  private updatePoliticalBusinesses(): void {
    if (!this.politicalBusiness || this.accessiblePoliticalBusinesses.length === 0) {
      return;
    }

    if (this.accessiblePoliticalBusinesses.length === 1) {
      this.selectedPoliticalBusiness = this.accessiblePoliticalBusinesses[0];
      return;
    }

    this.selectedPoliticalBusiness = this.accessiblePoliticalBusinesses.find(x => x.id === this.politicalBusiness!.id);
  }
}
