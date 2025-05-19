/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  VoteResultBallot as VoteResultBallotProto,
  VoteResultBallotQuestionAnswer as VoteResultBallotQuestionAnswerProto,
  VoteResultBundle as VoteResultBundleProto,
  VoteResultBundles as VoteResultBundlesProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_result_bundle_pb';
import {
  BallotQuestionResult as BallotQuestionResultProto,
  BallotResult as BallotResultProto,
  TieBreakQuestionResult as TieBreakQuestionResultProto,
  VoteResult as VoteResultProto,
  VoteResultEntryParams as VoteResultEntryParamsProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_result_pb';
import {
  BallotQuestionResultNullableSubTotal as BallotQuestionResultNullableSubTotalProto,
  BallotQuestionResultSubTotal as BallotQuestionResultSubTotalProto,
  TieBreakQuestionResultNullableSubTotal as TieBreakQuestionResultNullableSubTotalProto,
  TieBreakQuestionResultSubTotal as TieBreakQuestionResultSubTotalProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_result_sub_total_pb';
import { VoteResultEntry } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/vote_pb';
import { BallotQuestionAnswer, TieBreakQuestionAnswer } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/vote_result_pb';
import { PoliticalBusinessResultBallot, PoliticalBusinessResultBundle, PoliticalBusinessResultBundles } from './ballot-bundle.model';
import { PoliticalBusinessNullableCountOfVoters } from './count-of-voters.model';
import { CountingCircle } from './counting-circle.model';
import { CountingCircleResult } from './result.model';
import { Ballot, BallotQuestion, TieBreakQuestion, Vote } from './vote.model';

export {
  VoteResultProto,
  BallotResultProto,
  BallotQuestionResultProto,
  BallotQuestionResultSubTotalProto,
  TieBreakQuestionResultProto,
  TieBreakQuestionResultSubTotalProto,
  VoteResultEntryParamsProto,
  VoteResultBundlesProto,
  VoteResultBundleProto,
  VoteResultBallotProto,
  VoteResultBallotQuestionAnswerProto,
  BallotQuestionResultNullableSubTotalProto,
  TieBreakQuestionResultNullableSubTotalProto,
};

export { VoteResultEntry, BallotQuestionAnswer, TieBreakQuestionAnswer };
export type VoteResultEntryParams = VoteResultEntryParamsProto.AsObject;

export interface VoteResult extends CountingCircleResult {
  vote: Vote;
  entry: VoteResultEntry;
  entryParams?: VoteResultEntryParams;
  results: BallotResult[];
  countingCircle: CountingCircle;
}

export interface BallotResult {
  id: string;
  ballot: Ballot;
  countOfVoters: PoliticalBusinessNullableCountOfVoters;
  questionResults: BallotQuestionResult[];
  tieBreakQuestionResults: TieBreakQuestionResult[];
  conventionalCountOfDetailedEnteredBallots: number;
  allBundlesReviewedOrDeleted: boolean;
}

export interface QuestionResultSubTotal {
  totalCountOfAnswer1: number;
  totalCountOfAnswer2: number;
  totalCountOfAnswerUnspecified: number;
}

export interface QuestionResultNullableSubTotal {
  totalCountOfAnswer1?: number;
  totalCountOfAnswer2?: number;
  totalCountOfAnswerUnspecified?: number;
}

export interface BallotQuestionResult {
  id: string;
  question: BallotQuestion;
  totalCountOfAnswer1: number;
  totalCountOfAnswer2: number;
  totalCountOfAnswerUnspecified: number;
  eVotingSubTotal: QuestionResultSubTotal;
  eCountingSubTotal: QuestionResultSubTotal;
  conventionalSubTotal: QuestionResultNullableSubTotal;
}

export interface VoteResultBundles extends PoliticalBusinessResultBundles {
  politicalBusinessResult: VoteResult;
  ballotResult: BallotResult;
}

export interface VoteResultBundleDetails {
  politicalBusinessResult: VoteResult;
  ballotResult: BallotResult;
  bundle: PoliticalBusinessResultBundle;
}

export interface VoteResultBallot extends PoliticalBusinessResultBallot {
  questionAnswers: VoteResultBallotQuestionAnswer[];
  tieBreakQuestionAnswers: VoteResultBallotTieBreakQuestionAnswer[];
}

export interface VoteResultBallotQuestionAnswer {
  question: BallotQuestion;
  answer?: BallotQuestionAnswer;
}

export interface VoteResultBallotTieBreakQuestionAnswer {
  question: TieBreakQuestion;
  answer?: TieBreakQuestionAnswer;
}

export interface TieBreakQuestionResult {
  id: string;
  question: TieBreakQuestion;
  totalCountOfAnswer1: number;
  totalCountOfAnswer2: number;
  totalCountOfAnswerUnspecified: number;
  eVotingSubTotal: QuestionResultSubTotal;
  eCountingSubTotal: QuestionResultSubTotal;
  conventionalSubTotal: QuestionResultNullableSubTotal;
}
