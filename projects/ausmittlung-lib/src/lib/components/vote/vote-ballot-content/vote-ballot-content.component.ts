/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BallotResult, VoteResultBallot, VoteResultBallotQuestionAnswer, VoteResultBallotTieBreakQuestionAnswer } from '../../../models';

@Component({
  selector: 'vo-ausm-vote-ballot-content',
  templateUrl: './vote-ballot-content.component.html',
  styleUrls: ['./vote-ballot-content.component.scss'],
  standalone: false,
})
export class VoteBallotContentComponent {
  @Input()
  public readonly: boolean = false;

  @Input()
  public disabled: boolean = false;

  @Input()
  public loadingBallot: boolean = true;

  @Input()
  public ballot!: VoteResultBallot;

  @Input()
  public ballotResult!: BallotResult;

  @Input()
  public activeAnswer?: VoteResultBallotQuestionAnswer | VoteResultBallotTieBreakQuestionAnswer;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();
}
