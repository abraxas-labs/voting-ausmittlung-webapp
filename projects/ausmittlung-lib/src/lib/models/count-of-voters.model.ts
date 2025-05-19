/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  CountOfVotersInformation as CountOfVotersInformationProto,
  CountOfVotersInformationSubTotal as CountOfVotersInformationSubTotalProto,
  PoliticalBusinessCountOfVoters as PoliticalBusinessCountOfVotersProto,
  PoliticalBusinessCountOfVotersSubTotal as PoliticalBusinessCountOfVotersSubTotalProto,
  PoliticalBusinessNullableCountOfVoters as PoliticalBusinessNullableCountOfVotersProto,
  PoliticalBusinessNullableCountOfVotersSubTotal as PoliticalBusinessNullableCountOfVotersSubTotalProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/count_of_voters_pb';
import { SexType, VoterType } from '.';
import { ReplaceProtoOptionalInts } from '../services/utils/proto.utils';

export {
  CountOfVotersInformationProto,
  CountOfVotersInformationSubTotalProto,
  PoliticalBusinessCountOfVotersProto,
  PoliticalBusinessCountOfVotersSubTotalProto,
  PoliticalBusinessNullableCountOfVotersSubTotalProto,
};

export interface CountOfVotersInformation {
  totalCountOfVoters: number;
  subTotalInfoList: CountOfVotersInformationSubTotal[];
}

export interface PoliticalBusinessNullableCountOfVoters
  extends Required<Omit<PoliticalBusinessNullableCountOfVotersProto.AsObject, 'conventionalSubTotal'>> {
  conventionalSubTotal: PoliticalBusinessNullableCountOfVotersSubTotal;
}

export type PoliticalBusinessCountOfVoters = Required<PoliticalBusinessNullableCountOfVoters>;

export type PoliticalBusinessCountOfVotersSubTotal = PoliticalBusinessCountOfVotersSubTotalProto.AsObject;

export type PoliticalBusinessNullableCountOfVotersSubTotal =
  ReplaceProtoOptionalInts<PoliticalBusinessNullableCountOfVotersSubTotalProto.AsObject>;

export interface CountOfVotersInformationSubTotal {
  sex: SexType;
  voterType: VoterType;
  countOfVoters?: number;
}

export function updateCountOfVotersCalculatedFields(
  countOfVoters: PoliticalBusinessNullableCountOfVoters,
  totalCountOfVoters?: number,
): void {
  const subTotals = [
    mapToNonNullableCountOfVotersSubTotal(countOfVoters.conventionalSubTotal),
    countOfVoters.eCountingSubTotal,
    countOfVoters.eVotingSubTotal,
  ];
  countOfVoters.totalReceivedBallots = subTotals.reduce((sum, x) => sum + x.receivedBallots, 0);
  countOfVoters.totalAccountedBallots = subTotals.reduce((sum, x) => sum + x.accountedBallots, 0);
  countOfVoters.totalUnaccountedBallots = subTotals.reduce((sum, x) => sum + x.blankBallots + x.invalidBallots, 0);
  countOfVoters.totalInvalidBallots = subTotals.reduce((sum, x) => sum + x.invalidBallots, 0);
  countOfVoters.totalBlankBallots = subTotals.reduce((sum, x) => sum + x.blankBallots, 0);

  if (!countOfVoters.totalReceivedBallots || !totalCountOfVoters) {
    countOfVoters.voterParticipation = 0;
    return;
  }

  // round to 6 decimal places has to be in sync with backend
  countOfVoters.voterParticipation = Math.round((countOfVoters.totalReceivedBallots / totalCountOfVoters) * 1000000) / 1000000;
}

export function mapToNonNullableCountOfVotersSubTotal(
  v: PoliticalBusinessNullableCountOfVotersSubTotal,
): PoliticalBusinessCountOfVotersSubTotal {
  return {
    ...v,
    accountedBallots: v.accountedBallots ?? 0,
    blankBallots: v.blankBallots ?? 0,
    invalidBallots: v.invalidBallots ?? 0,
    receivedBallots: v.receivedBallots ?? 0,
  };
}

export function mapToCountOfVoters(data: PoliticalBusinessCountOfVotersProto.AsObject): PoliticalBusinessCountOfVoters {
  return {
    ...data,
    conventionalSubTotal: data.conventionalSubTotal!,
    eVotingSubTotal: data.eVotingSubTotal!,
    eCountingSubTotal: data.eCountingSubTotal!,
  };
}

export function mapToNullableCountOfVoters(
  data: PoliticalBusinessNullableCountOfVotersProto.AsObject,
): PoliticalBusinessNullableCountOfVoters {
  return {
    ...data,
    conventionalSubTotal: {
      accountedBallots: data.conventionalSubTotal!.accountedBallots?.value,
      blankBallots: data.conventionalSubTotal!.blankBallots?.value,
      invalidBallots: data.conventionalSubTotal!.invalidBallots?.value,
      receivedBallots: data.conventionalSubTotal!.receivedBallots?.value,
    },
    eVotingSubTotal: data.eVotingSubTotal!,
    eCountingSubTotal: data.eCountingSubTotal!,
  };
}

export function mapCountOfVotersProtoToModel(obj: PoliticalBusinessCountOfVotersProto.AsObject): PoliticalBusinessCountOfVoters {
  return {
    ...obj,
    conventionalSubTotal: obj.conventionalSubTotal!,
    eCountingSubTotal: obj.eCountingSubTotal!,
    eVotingSubTotal: obj.eVotingSubTotal!,
  };
}
