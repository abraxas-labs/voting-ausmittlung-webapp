/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  CountOfVotersInformation as CountOfVotersInformationProto,
  CountOfVotersInformationSubTotal as CountOfVotersInformationSubTotalProto,
  PoliticalBusinessCountOfVoters as PoliticalBusinessCountOfVotersProto,
  PoliticalBusinessNullableCountOfVoters as PoliticalBusinessNullableCountOfVotersProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/count_of_voters_pb';
import { SexType, VoterType } from '.';

export { CountOfVotersInformationProto, CountOfVotersInformationSubTotalProto, PoliticalBusinessCountOfVotersProto };

export interface CountOfVotersInformation {
  totalCountOfVoters: number;
  subTotalInfoList: CountOfVotersInformationSubTotal[];
}

export type PoliticalBusinessCountOfVoters = PoliticalBusinessCountOfVotersProto.AsObject;

export interface CountOfVotersInformationSubTotal {
  sex: SexType;
  voterType: VoterType;
  countOfVoters?: number;
}

export interface PoliticalBusinessNullableCountOfVoters
  extends Omit<
    PoliticalBusinessNullableCountOfVotersProto.AsObject,
    'conventionalAccountedBallots' | 'conventionalBlankBallots' | 'conventionalInvalidBallots' | 'conventionalReceivedBallots'
  > {
  conventionalAccountedBallots?: number;
  conventionalBlankBallots?: number;
  conventionalInvalidBallots?: number;
  conventionalReceivedBallots?: number;
}

export function updateCountOfVotersCalculatedFields(
  countOfVoters: PoliticalBusinessNullableCountOfVoters,
  totalCountOfVoters?: number,
): void {
  countOfVoters.totalReceivedBallots = (countOfVoters.conventionalReceivedBallots ?? 0) + countOfVoters.eVotingReceivedBallots;
  countOfVoters.totalAccountedBallots = (countOfVoters.conventionalAccountedBallots ?? 0) + countOfVoters.eVotingAccountedBallots;
  countOfVoters.totalUnaccountedBallots =
    (countOfVoters.conventionalBlankBallots ?? 0) +
    (countOfVoters.conventionalInvalidBallots ?? 0) +
    countOfVoters.eVotingInvalidBallots +
    countOfVoters.eVotingBlankBallots;
  countOfVoters.totalInvalidBallots = (countOfVoters.conventionalInvalidBallots ?? 0) + countOfVoters.eVotingInvalidBallots;
  countOfVoters.totalBlankBallots = (countOfVoters.conventionalBlankBallots ?? 0) + countOfVoters.eVotingBlankBallots;

  if (!countOfVoters.totalReceivedBallots || !totalCountOfVoters) {
    countOfVoters.voterParticipation = 0;
    return;
  }

  // round to 6 decimal places has to be in sync with backend
  countOfVoters.voterParticipation = Math.round((countOfVoters.totalReceivedBallots / totalCountOfVoters) * 1000000) / 1000000;
}

export function mapToNullableCountOfVoters(
  v: PoliticalBusinessNullableCountOfVotersProto.AsObject,
): PoliticalBusinessNullableCountOfVoters {
  return {
    ...v,
    conventionalAccountedBallots: v.conventionalAccountedBallots?.value,
    conventionalBlankBallots: v.conventionalBlankBallots?.value,
    conventionalInvalidBallots: v.conventionalInvalidBallots?.value,
    conventionalReceivedBallots: v.conventionalReceivedBallots?.value,
  };
}
