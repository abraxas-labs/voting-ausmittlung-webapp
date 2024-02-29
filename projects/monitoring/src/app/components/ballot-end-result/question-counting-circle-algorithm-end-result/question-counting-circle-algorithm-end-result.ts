/**
 * (c) Copyright 2024 by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnInit } from '@angular/core';
import { BallotQuestionEndResult, TieBreakQuestionEndResult, VoteResultAlgorithm } from 'ausmittlung-lib';

@Component({
  selector: 'app-question-counting-circle-algorithm-end-result',
  templateUrl: './question-counting-circle-algorithm-end-result.html',
  styleUrls: ['./question-counting-circle-algorithm-end-result.scss'],
})
export class QuestionCountingCircleAlgorithmEndResultComponent implements OnInit {
  @Input()
  public endResult!: BallotQuestionEndResult | TieBreakQuestionEndResult;

  @Input()
  public voteResultAlgorithm!: VoteResultAlgorithm;

  @Input()
  public isTieBreakQuestion: boolean = false;

  @Input()
  public ballotNumberOfQuestions: number = 1;

  public resultLabel: string = '';
  public isAccepted: boolean = false;

  public ngOnInit(): void {
    const isMajorityResult = this.voteResultAlgorithm === VoteResultAlgorithm.VOTE_RESULT_ALGORITHM_COUNTING_CIRCLE_MAJORITY;

    if (!this.isTieBreakQuestion) {
      const questionEndResult = this.endResult as BallotQuestionEndResult;
      this.isAccepted = questionEndResult.accepted;
      this.resultLabel = isMajorityResult ? 'VOTE_END_RESULT.MAJORITY' : 'VOTE_END_RESULT.UNANIMITY';
      this.resultLabel += this.isAccepted ? '_YES' : '_NO';
    } else {
      const tieBreakQuestionEndResult = this.endResult as TieBreakQuestionEndResult;
      this.isAccepted = !!tieBreakQuestionEndResult.questionNumberWithMajority;
      this.resultLabel = this.isAccepted
        ? 'VOTE_END_RESULT.TIE_BREAK_QUESTION_END_RESULT.QN_MAJORITY'
        : 'VOTE_END_RESULT.TIE_BREAK_QUESTION_END_RESULT.UNDEFINED';
    }
  }
}
