/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  ProportionalElectionBallotCandidate as ProportionalElectionBallotCandidateProto,
  ProportionalElectionResultBallot as ProportionalElectionResultBallotProto,
  ProportionalElectionResultBundle as ProportionalElectionResultBundleProto,
  ProportionalElectionResultBundles as ProportionalElectionResultBundlesProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/proportional_election_result_bundle_pb';
import {
  ProportionalElectionCandidateResult as ProportionalElectionCandidateResultProto,
  ProportionalElectionListResult as ProportionalElectionListResultProto,
  ProportionalElectionListResults as ProportionalElectionListResultsProto,
  ProportionalElectionResult as ProportionalElectionResultProto,
  ProportionalElectionResultEntryParams as ProportionalElectionResultEntryParamsProto,
  ProportionalElectionUnmodifiedListResult as ProportionalElectionUnmodifiedListResultProto,
  ProportionalElectionUnmodifiedListResults as ProportionalElectionUnmodifiedListResultsProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/proportional_election_result_pb';
import {
  ProportionalElectionCandidateResultSubTotal as ProportionalElectionCandidateResultSubTotalProto,
  ProportionalElectionListResultSubTotal as ProportionalElectionListResultSubTotalProto,
  ProportionalElectionResultSubTotal as ProportionalElectionResultSubTotalProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/proportional_election_result_sub_total_pb';
import { PoliticalBusinessResultBundle, PoliticalBusinessResultBundles } from './ballot-bundle.model';
import { PoliticalBusinessNullableCountOfVoters } from './count-of-voters.model';
import { CountingCircle } from './counting-circle.model';
import { ElectionResultBallot } from './election-result-ballot.model';
import { ProportionalElection, ProportionalElectionCandidate, ProportionalElectionList } from './proportional-election.model';
import { CountingCircleResult } from './result.model';

export {
  ProportionalElectionResultEntryParamsProto,
  ProportionalElectionResultProto,
  ProportionalElectionUnmodifiedListResultsProto,
  ProportionalElectionUnmodifiedListResultProto,
  ProportionalElectionResultBundlesProto,
  ProportionalElectionResultBundleProto,
  ProportionalElectionResultBallotProto,
  ProportionalElectionListResultsProto,
  ProportionalElectionResultSubTotalProto,
  ProportionalElectionListResultSubTotalProto,
  ProportionalElectionCandidateResultSubTotalProto,
};

export type ProportionalElectionResultEntryParams = ProportionalElectionResultEntryParamsProto.AsObject;
export type ProportionalElectionResultSubTotal = ProportionalElectionResultSubTotalProto.AsObject;
export type ProportionalElectionListResultSubTotal = ProportionalElectionListResultSubTotalProto.AsObject;
export type ProportionalElectionCandidateResultSubTotal = ProportionalElectionCandidateResultSubTotalProto.AsObject;

export interface ProportionalElectionResult extends CountingCircleResult {
  election: ProportionalElection;
  entryParams: ProportionalElectionResultEntryParams;
  countOfVoters: PoliticalBusinessNullableCountOfVoters;
  totalCountOfUnmodifiedLists: number;
  totalCountOfBallots: number;
  totalCountOfLists: number;
  allBundlesReviewedOrDeleted: boolean;
  countingCircle: CountingCircle;
  eVotingSubTotal: ProportionalElectionResultSubTotal;
  eCountingSubTotal: ProportionalElectionResultSubTotal;
  conventionalSubTotal: ProportionalElectionResultSubTotal;
}

export interface ProportionalElectionUnmodifiedListResults {
  electionResult: ProportionalElectionResult;
  unmodifiedListResults: ProportionalElectionUnmodifiedListResult[];
}

export type ProportionalElectionListResult = ProportionalElectionListResultProto.AsObject;
export type ProportionalElectionCandidateResult = ProportionalElectionCandidateResultProto.AsObject;

export interface ProportionalElectionUnmodifiedListResult {
  list: ProportionalElectionList;
  conventionalVoteCount: number;
}

export interface ProportionalElectionResultBundles extends PoliticalBusinessResultBundles<ProportionalElectionResultBundle> {
  politicalBusinessResult: ProportionalElectionResult;
}

export interface ProportionalElectionResultBundleDetails {
  electionResult: ProportionalElectionResult;
  bundle: ProportionalElectionResultBundle;
}

export interface ProportionalElectionResultBundle extends PoliticalBusinessResultBundle {
  list?: ProportionalElectionList;
}

export interface ProportionalElectionResultBallot extends ElectionResultBallot {
  candidates: ProportionalElectionBallotCandidate[];
}

export interface ProportionalElectionBallotCandidate extends ProportionalElectionBallotCandidateProto.AsObject {
  accumulated: boolean;
}

export type ProportionalElectionOrBallotCandidate = ProportionalElectionCandidate | ProportionalElectionBallotCandidate;
