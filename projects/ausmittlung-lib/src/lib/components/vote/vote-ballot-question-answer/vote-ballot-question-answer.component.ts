/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BallotQuestion, BallotQuestionAnswer, TieBreakQuestion, TieBreakQuestionAnswer } from '../../../models';

@Component({
  selector: 'vo-ausm-vote-ballot-question-answer',
  templateUrl: './vote-ballot-question-answer.component.html',
  styleUrls: ['./vote-ballot-question-answer.component.scss'],
  standalone: false,
})
export class VoteBallotQuestionAnswerComponent {
  public BallotQuestionAnswer: typeof BallotQuestionAnswer = BallotQuestionAnswer;
  public TieBreakQuestionAnswer: typeof TieBreakQuestionAnswer = TieBreakQuestionAnswer;

  @Input()
  public isTieBreakQuestion: boolean = false;

  @Input()
  public ballotNumberOfQuestions: number = 1;

  @Input()
  public readonly: boolean = false;

  @Input()
  public disabled: boolean = false;

  @Input()
  public question!: BallotQuestion | TieBreakQuestion;

  @Input()
  public answer?: BallotQuestionAnswer | TieBreakQuestionAnswer;

  @Input()
  public active: boolean = false;

  @Output()
  public answerChange: EventEmitter<BallotQuestionAnswer | TieBreakQuestionAnswer> = new EventEmitter<
    BallotQuestionAnswer | TieBreakQuestionAnswer
  >();

  public updateAnswer(answer: BallotQuestionAnswer | TieBreakQuestionAnswer): void {
    this.answer = answer;
    this.answerChange.emit(answer);
  }
}
