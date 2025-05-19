/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BallotQuestionResult, TieBreakQuestionResult } from '../../../../models';
import { BallotSubType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';

@Component({
  selector: 'vo-ausm-contest-vote-detail-question',
  templateUrl: './contest-vote-detail-question.component.html',
  styleUrls: ['./contest-vote-detail-question.component.scss'],
  standalone: false,
})
export class ContestVoteDetailQuestionComponent {
  @Input()
  public isTieBreakQuestion: boolean = false;

  @Input()
  public ballotNumberOfQuestions: number = 1;

  @Input()
  public result!: BallotQuestionResult | TieBreakQuestionResult;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  @Input()
  public readonly: boolean = true;

  @Input()
  public ballotSubType?: BallotSubType;

  @Output()
  public countOfAnswersChanged: EventEmitter<void> = new EventEmitter<void>();

  public updateTotal(): void {
    const conventionalSubTotal = this.result.conventionalSubTotal;
    const eVotingSubTotal = this.result.eVotingSubTotal;
    const eCountingSubTotal = this.result.eCountingSubTotal;

    this.result.totalCountOfAnswer1 =
      +(conventionalSubTotal.totalCountOfAnswer1 ?? 0) + +eVotingSubTotal.totalCountOfAnswer1 + +eCountingSubTotal.totalCountOfAnswer1;
    this.result.totalCountOfAnswer2 =
      +(conventionalSubTotal.totalCountOfAnswer2 ?? 0) + +eVotingSubTotal.totalCountOfAnswer2 + +eCountingSubTotal.totalCountOfAnswer2;
    this.result.totalCountOfAnswerUnspecified =
      +(conventionalSubTotal.totalCountOfAnswerUnspecified ?? 0) +
      +eVotingSubTotal.totalCountOfAnswerUnspecified +
      +eCountingSubTotal.totalCountOfAnswerUnspecified;

    this.countOfAnswersChanged.emit();
  }
}
