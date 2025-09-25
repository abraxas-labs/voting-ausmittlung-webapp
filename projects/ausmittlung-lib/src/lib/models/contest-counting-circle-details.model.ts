/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContestCountingCircleDetails as ContestCountingCircleDetailsProto } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contest_counting_circle_details_pb';
import { CountOfVotersInformationSubTotal } from './count-of-voters.model';
import { VotingCardResultDetail } from './voting-cards.model';
import { CountingMachine } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/counting_machine_pb';

export { ContestCountingCircleDetailsProto, CountingMachine };

export interface ContestCountingCircleDetails {
  contestId: string;
  countingCircleId: string;
  countOfVotersInformationSubTotals: CountOfVotersInformationSubTotal[];
  votingCards: VotingCardResultDetail[];
  eVoting: boolean;
  eCounting: boolean;
  eCountingResultsImported: boolean;
  countingMachine: CountingMachine;
}
