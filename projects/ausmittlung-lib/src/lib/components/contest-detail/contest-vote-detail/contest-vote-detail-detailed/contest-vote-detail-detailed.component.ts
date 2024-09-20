/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VoteResult } from '../../../../models';
import { BallotCountInputComponent } from '../../../ballot-count-input/ballot-count-input.component';
import { ThemeService } from '@abraxas/voting-lib';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vo-ausm-contest-vote-detail-detailed',
  templateUrl: './contest-vote-detail-detailed.component.html',
  styleUrls: ['./contest-vote-detail-detailed.component.scss'],
})
export class ContestVoteDetailDetailedComponent implements OnDestroy {
  @Input()
  public resultDetail!: VoteResult;

  @Input()
  public eVoting: boolean = true;

  @Input()
  public totalCountOfVoters!: number;

  @Input()
  public readonly: boolean = true;

  @Output()
  public countOfVotersChange: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(BallotCountInputComponent)
  private ballotCountInputComponent!: BallotCountInputComponent;

  public newZhFeaturesEnabled: boolean = false;

  private readonly routeSubscription: Subscription;

  constructor(private readonly router: Router, private readonly themeService: ThemeService, route: ActivatedRoute) {
    this.routeSubscription = route.data.subscribe(async ({ contestCantonDefaults }) => {
      this.newZhFeaturesEnabled = contestCantonDefaults.newZhFeaturesEnabled;
    });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  public async openBundles(voteResultId: string, ballotResultId: string): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'vote-result', voteResultId, 'ballot-result', ballotResultId, 'bundles']);
  }

  public setFocus(): void {
    this.ballotCountInputComponent.setFocus();
  }
}
