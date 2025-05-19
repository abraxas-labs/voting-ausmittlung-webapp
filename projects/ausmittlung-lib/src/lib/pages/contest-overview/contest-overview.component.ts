/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContestState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contest_pb';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ContestSummary } from '../../models';
import { ContestService } from '../../services/contest.service';

@Component({
  selector: 'vo-ausm-contest-overview',
  templateUrl: './contest-overview.component.html',
  styleUrls: ['./contest-overview.component.scss'],
  standalone: false,
})
export class ContestOverviewComponent implements OnInit {
  @Output()
  public openDetail: EventEmitter<ContestSummary> = new EventEmitter<ContestSummary>();

  public loading: boolean = true;
  public contests: ContestSummary[] = [];
  public pastContests: ContestSummary[] = [];
  public archivedContests: ContestSummary[] = [];

  constructor(private readonly contestService: ContestService) {}

  public async ngOnInit(): Promise<void> {
    try {
      [this.contests, this.pastContests, this.archivedContests] = await Promise.all([
        this.contestService.listSummaries(ContestState.CONTEST_STATE_ACTIVE, ContestState.CONTEST_STATE_TESTING_PHASE),
        this.contestService.listSummaries(ContestState.CONTEST_STATE_PAST_UNLOCKED, ContestState.CONTEST_STATE_PAST_LOCKED),
        this.contestService.listSummaries(ContestState.CONTEST_STATE_ARCHIVED),
      ]);
    } finally {
      this.loading = false;
    }
  }
}
