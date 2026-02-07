/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import {
  ProportionalElectionUnionResultServiceClient,
  ProportionalElectionUnionResultServicePromiseClient,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/proportional_election_union_result_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcStreamingService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DoubleProportionalResult,
  DoubleProportionalResultSubApportionmentLotDecision,
  DoubleProportionalResultSuperApportionmentLotDecision,
} from '../models';
import { ContestService } from './contest.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import {
  FinalizeProportionalElectionUnionEndResultRequest,
  GetProportionalElectionUnionDoubleProportionalResultSubApportionmentAvailableLotDecisionsRequest,
  GetProportionalElectionUnionDoubleProportionalResultSuperApportionmentAvailableLotDecisionsRequest,
  GetProportionalElectionUnionEndResultRequest,
  GetProportionalElectionUnionPartialEndResultRequest,
  PrepareFinalizeProportionalElectionUnionEndResultRequest,
  RevertProportionalElectionUnionEndResultFinalizationRequest,
  UpdateProportionalElectionUnionDoubleProportionalResultSubApportionmentLotDecisionRequest,
  UpdateProportionalElectionUnionDoubleProportionalResultSuperApportionmentLotDecisionRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/proportional_election_union_result_requests_pb';
import {
  ProportionalElectionUnionEndResult,
  ProportionalElectionUnionEndResultProto,
} from '../models/proportional-election-union-end-result.model';
import { ProportionalElectionResultService } from './proportional-election-result.service';
import { PoliticalBusinessUnionService } from './political-business-union.service';
import { DoubleProportionalResultService } from './double-proportional-result.service';

@Injectable({
  providedIn: 'root',
})
export class ProportionalElectionUnionResultService extends GrpcStreamingService<
  ProportionalElectionUnionResultServicePromiseClient,
  ProportionalElectionUnionResultServiceClient
> {
  constructor() {
    const grpcBackend = inject(GrpcBackendService);
    const env = inject<GrpcEnvironment>(GRPC_ENV_INJECTION_TOKEN);

    super(ProportionalElectionUnionResultServicePromiseClient, ProportionalElectionUnionResultServiceClient, env, grpcBackend);
  }

  public getDoubleProportionalResult(proportionalElectionUnionId: string): Promise<DoubleProportionalResult> {
    const req = new GetProportionalElectionUnionEndResultRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    return this.request(
      c => c.getDoubleProportionalResult,
      req,
      r => DoubleProportionalResultService.mapToDoubleProportionalResult(r),
    );
  }

  public getPartialEndResult(proportionalElectionUnionId: string): Promise<ProportionalElectionUnionEndResult> {
    const req = new GetProportionalElectionUnionPartialEndResultRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    return this.request(
      c => c.getPartialEndResult,
      req,
      r => this.mapToProportionalElectionUnionEndResult(r),
    );
  }

  public getEndResult(proportionalElectionUnionId: string): Promise<ProportionalElectionUnionEndResult> {
    const req = new GetProportionalElectionUnionEndResultRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    return this.request(
      c => c.getEndResult,
      req,
      r => this.mapToProportionalElectionUnionEndResult(r),
    );
  }

  public prepareFinalizeEndResult(proportionalElectionUnionId: string): Promise<SecondFactorTransaction> {
    const req = new PrepareFinalizeProportionalElectionUnionEndResultRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    return this.request(
      c => c.prepareFinalizeEndResult,
      req,
      r => r,
    );
  }

  public finalizeEndResult(proportionalElectionUnionId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new FinalizeProportionalElectionUnionEndResultRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.finalizeEndResult, req);
  }

  public revertEndResultFinalization(proportionalElectionId: string): Promise<void> {
    const req = new RevertProportionalElectionUnionEndResultFinalizationRequest();
    req.setProportionalElectionUnionId(proportionalElectionId);
    return this.requestEmptyResp(c => c.revertEndResultFinalization, req);
  }

  public getDoubleProportionalResultSuperApportionmentAvailableLotDecisions(
    proportionalElectionUnionId: string,
  ): Promise<DoubleProportionalResultSuperApportionmentLotDecision[]> {
    const req = new GetProportionalElectionUnionDoubleProportionalResultSuperApportionmentAvailableLotDecisionsRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    return this.request(
      c => c.getDoubleProportionalResultSuperApportionmentAvailableLotDecisions,
      req,
      r => r.getLotDecisionsList().map(l => DoubleProportionalResultService.mapToDoubleProportionalSuperApportionmentLotDecision(l)),
    );
  }

  public UpdateDoubleProportionalResultSuperApportionmentLotDecision(
    proportionalElectionUnionId: string,
    lotNumber: number,
  ): Promise<void> {
    const req = new UpdateProportionalElectionUnionDoubleProportionalResultSuperApportionmentLotDecisionRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    req.setNumber(lotNumber);
    return this.requestEmptyResp(c => c.updateDoubleProportionalResultSuperApportionmentLotDecision, req);
  }

  public getDoubleProportionalResultSubApportionmentAvailableLotDecisions(
    proportionalElectionUnionId: string,
  ): Promise<DoubleProportionalResultSubApportionmentLotDecision[]> {
    const req = new GetProportionalElectionUnionDoubleProportionalResultSubApportionmentAvailableLotDecisionsRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    return this.request(
      c => c.getDoubleProportionalResultSubApportionmentAvailableLotDecisions,
      req,
      r => r.getLotDecisionsList().map(l => DoubleProportionalResultService.mapToDoubleProportionalSubApportionmentLotDecision(l)),
    );
  }

  public UpdateDoubleProportionalResultSubApportionmentLotDecision(proportionalElectionUnionId: string, lotNumber: number): Promise<void> {
    const req = new UpdateProportionalElectionUnionDoubleProportionalResultSubApportionmentLotDecisionRequest();
    req.setProportionalElectionUnionId(proportionalElectionUnionId);
    req.setNumber(lotNumber);
    return this.requestEmptyResp(c => c.updateDoubleProportionalResultSubApportionmentLotDecision, req);
  }

  private mapToProportionalElectionUnionEndResult(data: ProportionalElectionUnionEndResultProto): ProportionalElectionUnionEndResult {
    for (const electionEndResultProto of data.getProportionalElectionEndResultsList()) {
      electionEndResultProto.setContest(data.getContest());
    }

    return {
      contest: ContestService.mapToContest(data.getContest()!),
      proportionalElectionUnion: PoliticalBusinessUnionService.mapToPoliticalBusinessUnion(data.getProportionalElectionUnion()!),
      proportionalElectionEndResults: data
        .getProportionalElectionEndResultsList()
        .map(x => ProportionalElectionResultService.mapToProportionalElectionEndResult(x)),
      countOfDoneElections: data.getCountOfDoneElections(),
      totalCountOfElections: data.getTotalCountOfElections(),
      allElectionsDone: data.getAllElectionsDone(),
      finalized: data.getFinalized(),
    };
  }
}
