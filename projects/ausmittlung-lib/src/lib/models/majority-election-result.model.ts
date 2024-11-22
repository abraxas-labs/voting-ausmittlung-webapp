/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  MajorityElectionBallotCandidate as MajorityElectionBallotCandidateProto,
  MajorityElectionResultBallot as MajorityElectionResultBallotProto,
  MajorityElectionResultBundle as MajorityElectionResultBundleProto,
  MajorityElectionResultBundles as MajorityElectionResultBundlesProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/majority_election_result_bundle_pb';
import {
  MajorityElectionBallotGroupResult as MajorityElectionBallotGroupResultProto,
  MajorityElectionBallotGroupResults as MajorityElectionBallotGroupResultsProto,
  MajorityElectionCandidateResult as MajorityElectionCandidateResultProto,
  MajorityElectionResult as MajorityElectionResultProto,
  MajorityElectionResultEntryParams as MajorityElectionResultEntryParamsProto,
  SecondaryMajorityElectionResult as SecondaryMajorityElectionResultProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/majority_election_result_pb';
import {
  MajorityElectionResultNullableSubTotal as MajorityElectionResultNullableSubTotalProto,
  MajorityElectionResultSubTotal as MajorityElectionResultSubTotalProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/majority_election_result_sub_total_pb';
import { MajorityElectionResultEntry as MajorityElectionResultEntryProto } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_pb';
import { PoliticalBusinessResultBundle } from './ballot-bundle.model';
import { PoliticalBusinessNullableCountOfVoters } from './count-of-voters.model';
import { CountingCircle } from './counting-circle.model';
import { ElectionResultBallot } from './election-result-ballot.model';
import {
  MajorityElection,
  MajorityElectionBallotGroup,
  MajorityElectionBase,
  MajorityElectionCandidate,
  SecondaryMajorityElection,
} from './majority-election.model';
import { CountingCircleResult } from './result.model';

export {
  MajorityElectionResultEntryParamsProto,
  MajorityElectionResultEntryProto,
  MajorityElectionResultBundlesProto,
  MajorityElectionResultBundleProto,
  MajorityElectionResultBallotProto,
  MajorityElectionResultProto,
  SecondaryMajorityElectionResultProto,
  MajorityElectionBallotCandidateProto,
  MajorityElectionBallotGroupResultsProto,
  MajorityElectionBallotGroupResultProto,
  MajorityElectionResultSubTotalProto,
  MajorityElectionCandidateResultProto,
  MajorityElectionResultNullableSubTotalProto,
};
export { MajorityElectionResultEntryProto as MajorityElectionResultEntry };
export type MajorityElectionResultEntryParams = MajorityElectionResultEntryParamsProto.AsObject;

export interface MajorityElectionResult extends CountingCircleResult, MajorityElectionResultTotal {
  election: MajorityElection;
  entry: MajorityElectionResultEntryProto;
  entryParams?: MajorityElectionResultEntryParams;
  countOfVoters: PoliticalBusinessNullableCountOfVoters;
  allBundlesReviewedOrDeleted: boolean;
  candidateResults: MajorityElectionCandidateResult[];
  secondaryMajorityElectionResults: SecondaryMajorityElectionResult[];
  conventionalCountOfBallotGroupVotes: number;
  conventionalCountOfDetailedEnteredBallots: number;
  countingCircle: CountingCircle;
  conventionalSubTotal: MajorityElectionResultNullableSubTotal;
  eVotingSubTotal: MajorityElectionResultSubTotal;
  hasUnmappedWriteIns: boolean;
  hasBallotGroups: boolean;
}

export type MajorityElectionResultSubTotal = MajorityElectionResultSubTotalProto.AsObject;

export interface MajorityElectionResultTotal {
  individualVoteCount: number;
  emptyVoteCount: number;
  invalidVoteCount: number;
  totalCandidateVoteCountExclIndividual: number;
  totalCandidateVoteCountInclIndividual: number;
}

export interface MajorityElectionResultNullableSubTotal {
  individualVoteCount?: number;
  emptyVoteCountInclWriteIns?: number;
  emptyVoteCountExclWriteIns?: number;
  emptyVoteCountWriteIns?: number;
  invalidVoteCount?: number;
  totalCandidateVoteCountExclIndividual: number;
  totalCandidateVoteCountInclIndividual: number;
}

export interface SecondaryMajorityElectionResult extends MajorityElectionResultTotal {
  election: SecondaryMajorityElection;
  candidateResults: MajorityElectionCandidateResult[];
  conventionalSubTotal: MajorityElectionResultNullableSubTotal;
  eVotingSubTotal: MajorityElectionResultSubTotal;
}

export interface MajorityElectionCandidateResult {
  candidate: MajorityElectionCandidate;
  voteCount: number;
  eVotingExclWriteInsVoteCount: number;
  eVotingWriteInsVoteCount: number;
  eVotingInclWriteInsVoteCount: number;
  conventionalVoteCount?: number;
}

export interface MajorityElectionResultBundles {
  politicalBusinessResult: MajorityElectionResult;
  bundles: PoliticalBusinessResultBundle[];
}

export interface MajorityElectionResultBundleDetails {
  electionResult: MajorityElectionResult;
  bundle: PoliticalBusinessResultBundle;
}

export interface MajorityElectionResultBallotBase {
  emptyVoteCount: number;
  computedEmptyVoteCount: number;
  individualVoteCount: number;
  invalidVoteCount: number;
  election: MajorityElectionBase;
  candidates: MajorityElectionBallotCandidate[];
}

export interface MajorityElectionResultBallot extends MajorityElectionResultBallotBase, ElectionResultBallot {
  secondaryMajorityElectionBallots: MajorityElectionResultBallotBase[];
}

export type MajorityElectionBallotCandidate = MajorityElectionBallotCandidateProto.AsObject;

export interface MajorityElectionBallotGroupResults {
  electionResult: MajorityElectionResult;
  ballotGroupResults: MajorityElectionBallotGroupResult[];
}

export interface MajorityElectionBallotGroupResult {
  ballotGroup: MajorityElectionBallotGroup;
  voteCount: number;
}

export function resetMajorityConventionalResults(result: MajorityElectionResult): void {
  const conventionalDefaultValue =
    result.entry === MajorityElectionResultEntryProto.MAJORITY_ELECTION_RESULT_ENTRY_DETAILED ? 0 : undefined;

  result.conventionalSubTotal.individualVoteCount = conventionalDefaultValue;
  result.conventionalSubTotal.emptyVoteCountInclWriteIns = conventionalDefaultValue;
  result.conventionalSubTotal.emptyVoteCountExclWriteIns = conventionalDefaultValue;
  result.conventionalSubTotal.emptyVoteCountWriteIns = conventionalDefaultValue;
  result.conventionalSubTotal.invalidVoteCount = conventionalDefaultValue;

  result.individualVoteCount = result.eVotingSubTotal.individualVoteCount;
  result.emptyVoteCount = result.eVotingSubTotal.emptyVoteCountInclWriteIns;
  result.invalidVoteCount = result.eVotingSubTotal.invalidVoteCount;

  result.conventionalCountOfDetailedEnteredBallots = 0;
  result.conventionalCountOfBallotGroupVotes = 0;
  result.allBundlesReviewedOrDeleted = true;

  for (const candidateResult of result.candidateResults) {
    candidateResult.conventionalVoteCount = conventionalDefaultValue;
    candidateResult.voteCount = candidateResult.eVotingInclWriteInsVoteCount;
  }

  for (const secondaryResult of result.secondaryMajorityElectionResults) {
    secondaryResult.conventionalSubTotal.individualVoteCount = conventionalDefaultValue;
    secondaryResult.conventionalSubTotal.emptyVoteCountInclWriteIns = conventionalDefaultValue;
    secondaryResult.conventionalSubTotal.emptyVoteCountExclWriteIns = conventionalDefaultValue;
    secondaryResult.conventionalSubTotal.emptyVoteCountWriteIns = conventionalDefaultValue;
    secondaryResult.conventionalSubTotal.invalidVoteCount = conventionalDefaultValue;

    secondaryResult.individualVoteCount = secondaryResult.eVotingSubTotal.individualVoteCount;
    secondaryResult.emptyVoteCount = secondaryResult.eVotingSubTotal.emptyVoteCountInclWriteIns;
    secondaryResult.invalidVoteCount = secondaryResult.eVotingSubTotal.invalidVoteCount;

    for (const candidateResult of secondaryResult.candidateResults) {
      candidateResult.conventionalVoteCount = conventionalDefaultValue;
      candidateResult.voteCount = candidateResult.eVotingInclWriteInsVoteCount;
    }
  }
}
