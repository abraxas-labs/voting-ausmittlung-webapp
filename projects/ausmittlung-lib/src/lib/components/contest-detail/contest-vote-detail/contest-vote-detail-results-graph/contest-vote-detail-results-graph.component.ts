/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { BallotResult } from '../../../../models';
import { BallotSubType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';

@Component({
  selector: 'vo-ausm-contest-vote-detail-results-graph',
  templateUrl: './contest-vote-detail-results-graph.component.html',
  styleUrls: ['./contest-vote-detail-results-graph.component.scss'],
  standalone: false,
})
export class ContestVoteDetailResultsGraphComponent {
  @Input()
  public ballotResult?: BallotResult;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;
}
