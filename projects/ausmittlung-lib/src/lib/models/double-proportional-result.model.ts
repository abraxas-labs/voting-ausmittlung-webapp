/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  DoubleProportionalResult as DoubleProportionalResultProto,
  DoubleProportionalResultColumn as DoubleProportionalResultColumnProto,
  DoubleProportionalResultRow as DoubleProportionalResultRowProto,
  DoubleProportionalResultCell as DoubleProportionalResultCellProto,
  DoubleProportionalResultApportionmentState,
  DoubleProportionalResultSuperApportionmentLotDecision as DoubleProportionalResultSuperApportionmentLotDecisionProto,
  DoubleProportionalResultSuperApportionmentLotDecisionColumn as DoubleProportionalResultSuperApportionmentLotDecisionColumnProto,
  DoubleProportionalResultSubApportionmentLotDecision as DoubleProportionalResultSubApportionmentLotDecisionProto,
  DoubleProportionalResultSubApportionmentLotDecisionColumn as DoubleProportionalResultSubApportionmentLotDecisionColumnProto,
  DoubleProportionalResultSubApportionmentLotDecisionCell as DoubleProportionalResultSubApportionmentLotDecisionCellProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/double_proportional_result_pb';
import { Contest } from './contest.model';
import { PoliticalBusinessUnion } from './political-business-union.model';
import { ProportionalElectionUnionList } from './proportional-election-union.model';
import { ProportionalElection, ProportionalElectionList, ProportionalElectionMandateAlgorithm } from './proportional-election.model';

export {
  DoubleProportionalResultProto,
  DoubleProportionalResultColumnProto,
  DoubleProportionalResultRowProto,
  DoubleProportionalResultCellProto,
  DoubleProportionalResultSuperApportionmentLotDecisionProto,
  DoubleProportionalResultSuperApportionmentLotDecisionColumnProto,
  DoubleProportionalResultSubApportionmentLotDecisionProto,
  DoubleProportionalResultSubApportionmentLotDecisionColumnProto,
  DoubleProportionalResultSubApportionmentLotDecisionCellProto,
  DoubleProportionalResultApportionmentState,
};

export interface DoubleProportionalResult {
  contest: Contest;
  proportionalElectionUnion?: PoliticalBusinessUnion;
  proportionalElection?: ProportionalElection;
  mandateAlgorithm: ProportionalElectionMandateAlgorithm;
  rows: DoubleProportionalResultRow[];
  columns: DoubleProportionalResultColumn[];

  numberOfMandates: number;
  voteCount: number;
  cantonalQuorum: number;
  voterNumber: number;
  electionKey: number;
  superApportionmentNumberOfMandates: number;
  subApportionmentNumberOfMandates: number;
  hasSuperApportionmentRequiredLotDecision: boolean;
  hasSubApportionmentRequiredLotDecision: boolean;
  superApportionmentState: DoubleProportionalResultApportionmentState;
  subApportionmentState: DoubleProportionalResultApportionmentState;
}

export interface DoubleProportionalResultColumn {
  unionList?: ProportionalElectionUnionList;
  list?: ProportionalElectionList;
  cells: DoubleProportionalResultCell[];

  voteCount: number;
  cantonalQuorumReached: boolean;
  anyRequiredQuorumReached: boolean;
  voterNumber: number;
  superApportionmentQuotient: number;
  superApportionmentNumberOfMandates: number;
  superApportionmentNumberOfMandatesExclLotDecision: number;
  subApportionmentNumberOfMandates: number;
  divisor: number;
  proportionalElectionQuorumReached: boolean;
  superApportionmentLotDecisionRequired: boolean;
}

export interface DoubleProportionalResultRow {
  proportionalElection: ProportionalElection;
  cells: DoubleProportionalResultCell[];

  voteCount: number;
  quorum: number;
  numberOfMandates: number;
  divisor: number;
  subApportionmentNumberOfMandates: number;
}

export interface DoubleProportionalResultCell {
  list: ProportionalElectionList;

  voteCount: number;
  proportionalElectionQuorumReached: boolean;
  voterNumber: number;
  subApportionmentNumberOfMandates: number;
  subApportionmentNumberOfMandatesExclLotDecision: number;
  subApportionmentLotDecisionRequired: boolean;
}

export interface DoubleProportionalResultSuperApportionmentLotDecision {
  number: number;
  columns: DoubleProportionalResultSuperApportionmentLotDecisionColumn[];
}

export interface DoubleProportionalResultSuperApportionmentLotDecisionColumn {
  unionList?: ProportionalElectionUnionList;
  list?: ProportionalElectionList;
  numberOfMandates: number;
}

export interface DoubleProportionalResultSubApportionmentLotDecision {
  number: number;
  columns: DoubleProportionalResultSubApportionmentLotDecisionColumn[];
}

export interface DoubleProportionalResultSubApportionmentLotDecisionColumn {
  unionList: ProportionalElectionUnionList;
  cells: DoubleProportionalResultSubApportionmentLotDecisionCell[];
}

export interface DoubleProportionalResultSubApportionmentLotDecisionCell {
  election: ProportionalElection;
  list: ProportionalElectionList;
  numberOfMandates: number;
}
