/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BallotQuestion, TieBreakQuestion } from '../models';

export type QuestionAttribute = 'question' | 'answer1' | 'answer2' | 'answer1Short' | 'answer2Short';

const fallbackI18nKeys: Record<QuestionAttribute, string> = {
  question: 'VOTE.BALLOT.QUESTION_COUNT.1.QUESTION_1.QUESTION',
  answer1: 'VOTE.BALLOT.ANSWER.YES',
  answer1Short: 'VOTE.BALLOT.ANSWER.YES',
  answer2: 'VOTE.BALLOT.ANSWER.NO',
  answer2Short: 'VOTE.BALLOT.ANSWER.NO',
};

const attributeKeyMap: Record<QuestionAttribute, string> = {
  question: 'QUESTION',
  answer1: 'ANSWER_1',
  answer1Short: 'ANSWER_1_SHORT',
  answer2: 'ANSWER_2',
  answer2Short: 'ANSWER_2_SHORT',
};

@Pipe({
  name: 'translateVoteQuestion',
})
export class TranslateVoteQuestionPipe implements PipeTransform {
  constructor(private readonly i18n: TranslateService) {}

  public transform(
    question: TieBreakQuestion | BallotQuestion,
    isTieBreak: boolean,
    attribute: QuestionAttribute,
    ballotNumberOfQuestions: number,
  ): string {
    const questionKey = isTieBreak ? 'TIE_BREAK' : 'QUESTION';
    const attributeKey = attributeKeyMap[attribute];
    const i18nKey = `VOTE.BALLOT.QUESTION_COUNT.${ballotNumberOfQuestions}.${questionKey}_${question.number}.${attributeKey}`;
    const translated = this.i18n.instant(i18nKey, question);
    return translated === i18nKey ? this.i18n.instant(fallbackI18nKeys[attribute], question) : translated;
  }
}
