/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import {
  AggregatedContestCountingCircleDetails as AggregatedContestCountingCircleDetailsProto,
  ContestCountingCircleDetails as ContestCountingCircleDetailsProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contest_counting_circle_details_pb';
import { CountOfVotersInformation } from './count-of-voters.model';
import { VotingCardResultDetail } from './voting-cards.model';

export { ContestCountingCircleDetailsProto, AggregatedContestCountingCircleDetailsProto };

export interface ContestCountingCircleDetails {
  contestId: string;
  countingCircleId: string;
  countOfVotersInformation: CountOfVotersInformation;
  votingCards: VotingCardResultDetail[];
  eVoting: boolean;
}

export interface AggregatedContestCountingCircleDetails {
  countOfVotersInformation: CountOfVotersInformation;
  votingCards: VotingCardResultDetail[];
}
