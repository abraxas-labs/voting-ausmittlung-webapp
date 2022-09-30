/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import {
  ResultList as ResultListProto,
  ResultListResult as ResultListResultProto,
  ResultOverview as ResultOverviewProto,
  ResultOverviewCountingCircleResult as ResultOverviewCountingCircleResultProto,
  ResultOverviewCountingCircleResults as ResultOverviewCountingCircleResultsProto,
  ResultStateChange as ResultStateChangeProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/results_pb';
import { ContestCountingCircleDetails } from './contest-counting-circle-details.model';
import { Contest } from './contest.model';
import { CountingCircle } from './counting-circle.model';
import { PoliticalBusiness, SimplePoliticalBusiness } from './political-business.model';
import { VotingCardChannel } from './voting-channel.model';

export {
  ResultStateChangeProto,
  ResultOverviewProto,
  ResultListProto,
  ResultOverviewCountingCircleResultsProto,
  ResultOverviewCountingCircleResultProto,
  ResultListResultProto,
};

export interface ResultOverview {
  contest: Contest;
  politicalBusinesses: SimplePoliticalBusiness[];
  countingCircleResults: ResultOverviewCountingCircleResults[];
}

export interface ResultOverviewCountingCircleResults {
  countingCircle: CountingCircle;
  results: ResultOverviewCountingCircleResult[];
}

export interface ResultOverviewCountingCircleResult
  extends Omit<ResultOverviewCountingCircleResultProto.AsObject, 'submissionDoneTimestamp'> {
  submissionDoneTimestamp?: Date;
}

export interface ResultList {
  contest: Contest;
  countingCircle: CountingCircle;
  details: ContestCountingCircleDetails;
  results: ResultListResult[];
  currentTenantIsResponsible: boolean;
  state: CountingCircleResultState;
  swissAbroadHaveVotingRightsOnAnyBusiness: boolean;
  contestCountingCircleContactPersonId: string;
  mustUpdateContactPersons: boolean;
  hasUnmappedEVotingWriteIns: boolean;
  enabledVotingCardChannels: VotingCardChannel[];
}

export interface ResultListResult {
  id: string;
  politicalBusiness: SimplePoliticalBusiness;
  state: CountingCircleResultState;
  submissionDoneTimestamp?: Date;
  hasComments: boolean;
}

export interface CountingCircleResult {
  id: string;
  politicalBusinessId: string;
  politicalBusiness: PoliticalBusiness;
  countingCircleId: string;
  state: CountingCircleResultState;
  totalCountOfVoters: number;
}
