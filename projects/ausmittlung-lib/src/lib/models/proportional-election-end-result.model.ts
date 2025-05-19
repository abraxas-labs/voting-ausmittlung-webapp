/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  ProportionalElectionCandidateEndResult as ProportionalElectionCandidateEndResultProto,
  ProportionalElectionEndResult as ProportionalElectionEndResultProto,
  ProportionalElectionEndResultAvailableLotDecision as ProportionalElectionEndResultAvailableLotDecisionProto,
  ProportionalElectionListEndResult as ProportionalElectionListEndResultProto,
  ProportionalElectionListEndResultAvailableLotDecisions as ProportionalElectionListEndResultAvailableLotDecisionsProto,
  ProportionalElectionEndResultListLotDecision as ProportionalElectionEndResultListLotDecisionProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/proportional_election_end_result_pb';
import { ProportionalElectionCandidateEndResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/proportional_election_end_result_pb';
import { PoliticalBusinessCountOfVoters } from './count-of-voters.model';
import { ElectionEndResultAvailableLotDecision } from './election-lot-decision.model';
import { PoliticalBusinessEndResult } from './political-business-end-result.model';
import { ProportionalElectionCandidateResultSubTotal, ProportionalElectionListResultSubTotal } from './proportional-election-result.model';
import {
  ProportionalElection,
  ProportionalElectionCandidate,
  ProportionalElectionList,
  ProportionalElectionListUnion,
} from './proportional-election.model';

export {
  ProportionalElectionEndResultProto,
  ProportionalElectionListEndResultAvailableLotDecisionsProto,
  ProportionalElectionCandidateEndResultProto,
  ProportionalElectionEndResultAvailableLotDecisionProto,
  ProportionalElectionListEndResultProto,
  ProportionalElectionEndResultListLotDecisionProto,
  ProportionalElectionCandidateEndResultState,
};

export interface ProportionalElectionEndResult extends PoliticalBusinessEndResult {
  election: ProportionalElection;
  countOfVoters: PoliticalBusinessCountOfVoters;
  listEndResults: ProportionalElectionListEndResult[];
  manualEndResultRequired: boolean;
  mandateDistributionTriggered: boolean;
  listLotDecisions: ProportionalElectionEndResultListLotDecision[];
}

export interface ProportionalElectionListEndResult {
  list: ProportionalElectionList;
  numberOfMandates: number;
  listVotesCount: number;
  blankRowsCount: number;
  totalVoteCount: number;
  eVotingSubTotal: ProportionalElectionListResultSubTotal;
  eCountingSubTotal: ProportionalElectionListResultSubTotal;
  conventionalSubTotal: ProportionalElectionListResultSubTotal;
  candidateEndResults: ProportionalElectionCandidateEndResult[];
  listUnion?: ProportionalElectionListUnion;
  subListUnion?: ProportionalElectionListUnion;
  hasOpenRequiredLotDecisions: boolean;
}

export interface ProportionalElectionCandidateEndResult {
  candidate: ProportionalElectionCandidate;
  voteCount: number;
  rank: number;
  lotDecision: boolean;
  lotDecisionEnabled: boolean;
  lotDecisionRequired: boolean;
  state: ProportionalElectionCandidateEndResultState;
  eVotingSubTotal: ProportionalElectionCandidateResultSubTotal;
  eCountingSubTotal: ProportionalElectionCandidateResultSubTotal;
  conventionalSubTotal: ProportionalElectionCandidateResultSubTotal;
}

export interface ProportionalElectionEndResultLotDecision {
  candidateId: string;
  rank?: number;
}

export interface ProportionalElectionListEndResultAvailableLotDecisions {
  listId: string;
  lotDecisions: ProportionalElectionEndResultAvailableLotDecision[];
}

export interface ProportionalElectionEndResultAvailableLotDecision extends ElectionEndResultAvailableLotDecision {
  candidate: ProportionalElectionCandidate;
}

export interface ProportionalElectionManualCandidateEndResult {
  candidate: ProportionalElectionCandidate;
  voteCount: number;
  rank: number;
  state: ProportionalElectionCandidateEndResultState;
}

export interface ProportionalElectionEndResultListLotDecision {
  entries: ProportionalElectionEndResultListLotDecisionEntry[];
}

export interface ProportionalElectionEndResultListLotDecisionEntry {
  listId?: string;
  listUnionId?: string;
  winning: boolean;
  description: string;
}
