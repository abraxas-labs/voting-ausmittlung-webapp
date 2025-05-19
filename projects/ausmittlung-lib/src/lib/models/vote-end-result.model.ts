/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  BallotEndResult as BallotEndResultProto,
  BallotQuestionEndResult as BallotQuestionEndResultProto,
  TieBreakQuestionEndResult as TieBreakQuestionEndResultProto,
  VoteEndResult as VoteEndResultProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_end_result_pb';
import { PoliticalBusinessCountOfVoters } from './count-of-voters.model';
import { PoliticalBusinessEndResult } from './political-business-end-result.model';
import { QuestionResultSubTotal } from './vote-result.model';
import { Ballot, BallotQuestion, TieBreakQuestion, Vote } from './vote.model';

export { VoteEndResultProto, BallotEndResultProto, BallotQuestionEndResultProto, TieBreakQuestionEndResultProto };

export interface VoteEndResult extends PoliticalBusinessEndResult {
  vote: Vote;
  ballotEndResults: BallotEndResult[];
}

export interface BallotEndResult {
  ballot: Ballot;
  countOfVoters: PoliticalBusinessCountOfVoters;
  questionEndResults: BallotQuestionEndResult[];
  tieBreakQuestionEndResults: TieBreakQuestionEndResult[];
}

export interface QuestionEndResultSubTotal {
  totalCountOfAnswer1: number;
  totalCountOfAnswer2: number;
  totalCountOfAnswerUnspecified: number;
}

export interface BallotQuestionEndResult {
  question: BallotQuestion;
  totalCountOfAnswer1: number;
  totalCountOfAnswer2: number;
  totalCountOfAnswerUnspecified: number;
  eVotingSubTotal: QuestionResultSubTotal;
  eCountingSubTotal: QuestionResultSubTotal;
  conventionalSubTotal: QuestionResultSubTotal;
  countOfCountingCircle1: number;
  countOfCountingCircle2: number;
  hasCountingCircleMajority: boolean;
  hasCountingCircleUnanimity: boolean;
  accepted: boolean;
}

export interface TieBreakQuestionEndResult {
  question: TieBreakQuestion;
  totalCountOfAnswer1: number;
  totalCountOfAnswer2: number;
  totalCountOfAnswerUnspecified: number;
  eVotingSubTotal: QuestionResultSubTotal;
  eCountingSubTotal: QuestionResultSubTotal;
  conventionalSubTotal: QuestionResultSubTotal;
  countOfCountingCircle1: number;
  countOfCountingCircle2: number;
  hasCountingCircleQ1Majority: boolean;
  hasCountingCircleQ2Majority: boolean;
  questionNumberWithMajority?: number;
  q1Accepted: boolean;
}
