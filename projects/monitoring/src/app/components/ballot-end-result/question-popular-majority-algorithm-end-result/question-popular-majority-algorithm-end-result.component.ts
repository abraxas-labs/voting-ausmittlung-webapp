/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { BallotQuestionEndResult, TieBreakQuestionEndResult } from 'ausmittlung-lib';
import { BallotSubType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';

@Component({
  selector: 'app-question-popular-majority-algorithm-end-result',
  templateUrl: './question-popular-majority-algorithm-end-result.component.html',
  styleUrls: ['./question-popular-majority-algorithm-end-result.component.scss'],
  standalone: false,
})
export class QuestionPopularMajorityAlgorithmEndResultComponent {
  @Input()
  public isTieBreakQuestion: boolean = false;

  @Input()
  public ballotNumberOfQuestions: number = 1;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  @Input()
  public endResult!: BallotQuestionEndResult | TieBreakQuestionEndResult;

  @Input()
  public ballotSubType?: BallotSubType;
}
