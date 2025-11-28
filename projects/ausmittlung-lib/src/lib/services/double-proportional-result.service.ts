/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import {
  DoubleProportionalResult,
  DoubleProportionalResultCell,
  DoubleProportionalResultCellProto,
  DoubleProportionalResultColumn,
  DoubleProportionalResultColumnProto,
  DoubleProportionalResultProto,
  DoubleProportionalResultRow,
  DoubleProportionalResultRowProto,
  DoubleProportionalResultSubApportionmentLotDecision,
  DoubleProportionalResultSubApportionmentLotDecisionProto,
  DoubleProportionalResultSuperApportionmentLotDecision,
  DoubleProportionalResultSuperApportionmentLotDecisionProto,
} from '../models';
import { ContestService } from './contest.service';
import { PoliticalBusinessUnionService } from './political-business-union.service';
import { sum } from './utils/array.utils';
import { ProportionalElectionService } from './proportional-election.service';

@Injectable({
  providedIn: 'root',
})
export class DoubleProportionalResultService {
  public static mapToDoubleProportionalResult(data: DoubleProportionalResultProto): DoubleProportionalResult {
    return {
      contest: ContestService.mapToContest(data.getContest()!),
      proportionalElectionUnion:
        data.getProportionalElectionUnion() != null
          ? PoliticalBusinessUnionService.mapToPoliticalBusinessUnion(data.getProportionalElectionUnion()!)
          : undefined,
      proportionalElection:
        data.getProportionalElection() != null ? ProportionalElectionService.mapToElection(data.getProportionalElection()!) : undefined,
      mandateAlgorithm: data.getMandateAlgorithm(),
      rows: data.getRowsList().map(x => this.mapToDoubleProportionalResultRow(x)),
      columns: data.getColumnsList().map(x => this.mapToDoubleProportionalResultColumn(x)),
      numberOfMandates: data.getNumberOfMandates(),
      voteCount: data.getVoteCount(),
      cantonalQuorum: data.getCantonalQuorum(),
      voterNumber: data.getVoterNumber(),
      electionKey: data.getElectionKey(),
      hasSuperApportionmentRequiredLotDecision: data.getHasSuperApportionmentRequiredLotDecision(),
      hasSubApportionmentRequiredLotDecision: data.getHasSubApportionmentRequiredLotDecision(),
      superApportionmentNumberOfMandates: data.getSubApportionmentNumberOfMandates(),
      subApportionmentNumberOfMandates: data.getSubApportionmentNumberOfMandates(),
      superApportionmentState: data.getSuperApportionmentState(),
      subApportionmentState: data.getSubApportionmentState(),
    };
  }

  public static mapToDoubleProportionalSuperApportionmentLotDecision(
    data: DoubleProportionalResultSuperApportionmentLotDecisionProto,
  ): DoubleProportionalResultSuperApportionmentLotDecision {
    return {
      number: data.getNumber(),
      columns: data.getColumnsList().map(co => ({
        unionList: co.getUnionList()?.toObject(),
        list: co.getList()?.toObject(),
        numberOfMandates: co.getNumberOfMandates(),
      })),
    };
  }

  public static mapToDoubleProportionalSubApportionmentLotDecision(
    data: DoubleProportionalResultSubApportionmentLotDecisionProto,
  ): DoubleProportionalResultSubApportionmentLotDecision {
    return {
      number: data.getNumber(),
      columns: data.getColumnsList().map(co => ({
        unionList: co.getUnionList()!.toObject(),
        cells: co.getCellsList().map(ce => ({
          list: ce.getList()!.toObject(),
          election: ProportionalElectionService.mapToElection(ce.getElection()!),
          numberOfMandates: ce.getNumberOfMandates(),
        })),
      })),
    };
  }

  private static mapToDoubleProportionalResultRow(data: DoubleProportionalResultRowProto): DoubleProportionalResultRow {
    return {
      proportionalElection: ProportionalElectionService.mapToElection(data.getProportionalElection()!),
      cells: data.getCellsList().map(x => this.mapToDoubleProportionalResultCell(x)),
      voteCount: data.getVoteCount(),
      quorum: data.getQuorum(),
      numberOfMandates: data.getNumberOfMandates(),
      divisor: data.getDivisor(),
      subApportionmentNumberOfMandates: data.getSubApportionmentNumberOfMandates(),
    };
  }

  private static mapToDoubleProportionalResultColumn(data: DoubleProportionalResultColumnProto): DoubleProportionalResultColumn {
    return {
      unionList: data.getUnionList() != null ? data.getUnionList()!.toObject() : undefined,
      list: data.getList() != null ? data.getList()!.toObject() : undefined,
      cells: data.getCellsList().map(x => this.mapToDoubleProportionalResultCell(x)),
      voteCount: data.getVoteCount(),
      cantonalQuorumReached: data.getCantonalQuorumReached(),
      anyRequiredQuorumReached: data.getAnyRequiredQuorumReached(),
      voterNumber: data.getVoterNumber(),
      superApportionmentQuotient: data.getSuperApportionmentQuotient(),
      superApportionmentNumberOfMandates: data.getSuperApportionmentNumberOfMandates(),
      superApportionmentNumberOfMandatesExclLotDecision: data.getSuperApportionmentNumberOfMandatesExclLotDecision(),
      divisor: data.getDivisor(),
      proportionalElectionQuorumReached: !!data.getCellsList().find(x => x.getProportionalElectionQuorumReached()),
      subApportionmentNumberOfMandates: data.getSubApportionmentNumberOfMandates(),
      superApportionmentLotDecisionRequired: data.getSuperApportionmentLotDecisionRequired(),
    };
  }

  private static mapToDoubleProportionalResultCell(data: DoubleProportionalResultCellProto): DoubleProportionalResultCell {
    return {
      ...data.toObject(),
      list: data.getList()!.toObject(),
    };
  }
}
