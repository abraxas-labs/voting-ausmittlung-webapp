/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import {
  ProportionalElectionResultServiceClient,
  ProportionalElectionResultServicePromiseClient,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/proportional_election_result_service_grpc_web_pb';
import {
  DefineProportionalElectionResultEntryParamsRequest,
  DefineProportionalElectionResultEntryRequest,
  EnterProportionalElectionCountOfVotersRequest,
  EnterProportionalElectionManualCandidateEndResultRequest,
  EnterProportionalElectionManualListEndResultRequest,
  EnterProportionalElectionUnmodifiedListResultRequest,
  EnterProportionalElectionUnmodifiedListResultsRequest,
  FinalizeProportionalElectionEndResultRequest,
  GetProportionalElectionEndResultRequest,
  GetProportionalElectionListEndResultAvailableLotDecisionsRequest,
  GetProportionalElectionListResultsRequest,
  GetProportionalElectionResultRequest,
  GetProportionalElectionUnmodifiedListResultsRequest,
  ProportionalElectionResultAuditedTentativelyRequest,
  ProportionalElectionResultCorrectionFinishedRequest,
  ProportionalElectionResultFlagForCorrectionRequest,
  ProportionalElectionResultPrepareCorrectionFinishedRequest,
  ProportionalElectionResultPrepareSubmissionFinishedRequest,
  ProportionalElectionResultResetToSubmissionFinishedRequest,
  ProportionalElectionResultsPlausibiliseRequest,
  ProportionalElectionResultsResetToAuditedTentativelyRequest,
  ProportionalElectionResultSubmissionFinishedRequest,
  RevertProportionalElectionEndResultFinalizationRequest,
  UpdateProportionalElectionEndResultLotDecisionRequest,
  UpdateProportionalElectionListEndResultLotDecisionsRequest,
  ValidateEnterProportionalElectionCountOfVotersRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/proportional_election_result_requests_pb';
import { GrpcBackendService, GrpcEnvironment } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  mapToNullableCountOfVoters,
  PoliticalBusinessNullableCountOfVoters,
  ProportionalElectionCandidateEndResult,
  ProportionalElectionCandidateEndResultProto,
  ProportionalElectionEndResult,
  ProportionalElectionEndResultAvailableLotDecision,
  ProportionalElectionEndResultAvailableLotDecisionProto,
  ProportionalElectionEndResultLotDecision,
  ProportionalElectionEndResultLotDecisionProto,
  ProportionalElectionEndResultProto,
  ProportionalElectionListEndResult,
  ProportionalElectionListEndResultAvailableLotDecisions,
  ProportionalElectionListEndResultAvailableLotDecisionsProto,
  ProportionalElectionListEndResultProto,
  ProportionalElectionListResult,
  ProportionalElectionManualCandidateEndResult,
  ProportionalElectionResult,
  ProportionalElectionResultEntryParams,
  ProportionalElectionResultProto,
  ProportionalElectionUnmodifiedListResult,
  ProportionalElectionUnmodifiedListResultProto,
  ProportionalElectionUnmodifiedListResults,
  ProportionalElectionUnmodifiedListResultsProto,
  ValidationSummary,
} from '../models';
import { ContestCountingCircleDetailsService } from './contest-counting-circle-details.service';
import { ContestService } from './contest.service';
import { PoliticalBusinessResultBaseService } from './political-business-result-base.service';
import { ProportionalElectionService } from './proportional-election.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { ValidationMappingService } from './validation-mapping.service';

@Injectable({
  providedIn: 'root',
})
export class ProportionalElectionResultService extends PoliticalBusinessResultBaseService<
  ProportionalElectionResult,
  ProportionalElectionResultServicePromiseClient,
  ProportionalElectionResultServiceClient
> {
  constructor(
    grpcBackend: GrpcBackendService,
    @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment,
    private readonly validationMapping: ValidationMappingService,
  ) {
    super(ProportionalElectionResultServicePromiseClient, ProportionalElectionResultServiceClient, env, grpcBackend);
  }

  public static mapToProportionalElectionResult(proportionalElectionResult: ProportionalElectionResultProto): ProportionalElectionResult {
    const obj = proportionalElectionResult.toObject();
    const election = ProportionalElectionService.mapToElection(proportionalElectionResult.getElection()!);
    return {
      ...obj,
      election,
      politicalBusinessId: obj.election!.id,
      politicalBusiness: {
        ...election,
        politicalBusinessType: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION,
      },
      countingCircle: obj.countingCircle!,
      entryParams: obj.entryParams!,
      countOfVoters: mapToNullableCountOfVoters(obj.countOfVoters!),
      totalCountOfVoters: proportionalElectionResult.getTotalCountOfVoters(),
      conventionalSubTotal: proportionalElectionResult.getConventionalSubTotal()!.toObject(),
      eVotingSubTotal: proportionalElectionResult.getEVotingSubTotal()!.toObject(),
    };
  }

  public get(electionId: string, countingCircleId: string): Promise<ProportionalElectionResult> {
    const req = new GetProportionalElectionResultRequest();
    req.setCountingCircleId(countingCircleId);
    req.setElectionId(electionId);
    return this.request(
      c => c.get,
      req,
      r => ProportionalElectionResultService.mapToProportionalElectionResult(r),
    );
  }

  public getByResultId(electionResultId: string): Promise<ProportionalElectionResult> {
    const req = new GetProportionalElectionResultRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.get,
      req,
      r => ProportionalElectionResultService.mapToProportionalElectionResult(r),
    );
  }

  public getUnmodifiedLists(electionResultId: string): Promise<ProportionalElectionUnmodifiedListResults> {
    const req = new GetProportionalElectionUnmodifiedListResultsRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.getUnmodifiedLists,
      req,
      r => this.mapToUnmodifiedListResults(r),
    );
  }

  public getListResults(electionResultId: string): Promise<ProportionalElectionListResult[]> {
    const req = new GetProportionalElectionListResultsRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.getListResults,
      req,
      r => r.toObject().listResultsList,
    );
  }

  public defineEntry(electionResultId: string, resultEntryParams: ProportionalElectionResultEntryParams): Promise<void> {
    const req = new DefineProportionalElectionResultEntryRequest();
    req.setElectionResultId(electionResultId);

    const resultEntryParamsReq = new DefineProportionalElectionResultEntryParamsRequest();
    resultEntryParamsReq.setAutomaticBallotBundleNumberGeneration(resultEntryParams.automaticBallotBundleNumberGeneration);
    resultEntryParamsReq.setAutomaticEmptyVoteCounting(resultEntryParams.automaticEmptyVoteCounting);
    resultEntryParamsReq.setBallotBundleSampleSize(resultEntryParams.ballotBundleSampleSize);
    resultEntryParamsReq.setBallotBundleSize(resultEntryParams.ballotBundleSize);
    resultEntryParamsReq.setBallotNumberGeneration(resultEntryParams.ballotNumberGeneration);
    resultEntryParamsReq.setReviewProcedure(resultEntryParams.reviewProcedure);
    req.setResultEntryParams(resultEntryParamsReq);
    return this.requestEmptyResp(c => c.defineEntry, req);
  }

  public async enterCountOfVoters(electionResultId: string, countOfVoters: PoliticalBusinessNullableCountOfVoters): Promise<void> {
    const req = this.mapToEnterCountOfVotersRequest(electionResultId, countOfVoters);
    await this.requestEmptyResp(c => c.enterCountOfVoters, req);
  }

  public async enterUnmodifiedListResults(electionResultId: string, results: ProportionalElectionUnmodifiedListResult[]): Promise<void> {
    const req = new EnterProportionalElectionUnmodifiedListResultsRequest();
    req.setElectionResultId(electionResultId);

    for (const result of results) {
      const resultReq = new EnterProportionalElectionUnmodifiedListResultRequest();
      resultReq.setVoteCount(result.conventionalVoteCount);
      resultReq.setListId(result.list.id);
      req.addResults(resultReq);
    }

    await this.requestEmptyResp(c => c.enterUnmodifiedListResults, req);
  }

  public async prepareSubmissionFinished(proportionalElectionResultId: string): Promise<SecondFactorTransaction> {
    const req = new ProportionalElectionResultPrepareSubmissionFinishedRequest();
    req.setElectionResultId(proportionalElectionResultId);
    return await this.request(
      c => c.prepareSubmissionFinished,
      req,
      r => r,
    );
  }

  public submissionFinished(proportionalElectionResultId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new ProportionalElectionResultSubmissionFinishedRequest();
    req.setElectionResultId(proportionalElectionResultId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.submissionFinished, req);
  }

  public async resetToSubmissionFinished(proportionalElectionResultId: string): Promise<void> {
    const req = new ProportionalElectionResultResetToSubmissionFinishedRequest();
    req.setElectionResultId(proportionalElectionResultId);
    await this.requestEmptyResp(c => c.resetToSubmissionFinished, req);
  }

  public async prepareCorrectionFinished(proportionalElectionResultId: string): Promise<SecondFactorTransaction> {
    const req = new ProportionalElectionResultPrepareCorrectionFinishedRequest();
    req.setElectionResultId(proportionalElectionResultId);
    return await this.request(
      c => c.prepareCorrectionFinished,
      req,
      r => r,
    );
  }

  public correctionFinished(proportionalElectionResultId: string, comment: string, secondFactorTransactionId: string): Observable<void> {
    const req = new ProportionalElectionResultCorrectionFinishedRequest();
    req.setElectionResultId(proportionalElectionResultId);
    req.setComment(comment);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.correctionFinished, req);
  }

  public async flagForCorrection(proportionalElectionResultId: string, comment: string): Promise<void> {
    const req = new ProportionalElectionResultFlagForCorrectionRequest();
    req.setElectionResultId(proportionalElectionResultId);
    req.setComment(comment);
    await this.requestEmptyResp(c => c.flagForCorrection, req);
  }

  public async auditedTentatively(proportionalElectionResultIds: string[]): Promise<void> {
    const req = new ProportionalElectionResultAuditedTentativelyRequest();
    req.setElectionResultIdsList(proportionalElectionResultIds);
    await this.requestEmptyResp(c => c.auditedTentatively, req);
  }

  public async plausibilise(proportionalElectionResultIds: string[]): Promise<void> {
    const req = new ProportionalElectionResultsPlausibiliseRequest();
    req.setElectionResultIdsList(proportionalElectionResultIds);
    await this.requestEmptyResp(c => c.plausibilise, req);
  }

  public async resetToAuditedTentatively(proportionalElectionResultIds: string[]): Promise<void> {
    const req = new ProportionalElectionResultsResetToAuditedTentativelyRequest();
    req.setElectionResultIdsList(proportionalElectionResultIds);
    await this.requestEmptyResp(c => c.resetToAuditedTentatively, req);
  }

  public getEndResult(proportionalElectionId: string): Promise<ProportionalElectionEndResult> {
    const req = new GetProportionalElectionEndResultRequest();
    req.setProportionalElectionId(proportionalElectionId);
    return this.request(
      c => c.getEndResult,
      req,
      r => this.mapToProportionalElectionEndResult(r),
    );
  }

  public getListEndResultAvailableLotDecisions(
    proportionalElectionListId: string,
  ): Promise<ProportionalElectionListEndResultAvailableLotDecisions> {
    const req = new GetProportionalElectionListEndResultAvailableLotDecisionsRequest();
    req.setProportionalElectionListId(proportionalElectionListId);
    return this.request(
      c => c.getListEndResultAvailableLotDecisions,
      req,
      r => this.mapToProportionalElectionEndResultAvailableLotDecisions(r),
    );
  }

  public updateListEndResultLotDecisions(
    proportionalElectionListId: string,
    lotDecisions: ProportionalElectionEndResultLotDecision[],
  ): Promise<void> {
    const req = new UpdateProportionalElectionListEndResultLotDecisionsRequest();
    req.setProportionalElectionListId(proportionalElectionListId);
    req.setLotDecisionsList(lotDecisions.map(x => this.mapToUpdateLotDecisionRequest(x)));
    return this.requestEmptyResp(c => c.updateListEndResultLotDecisions, req);
  }

  public prepareFinalizeEndResult(proportionalElectionId: string): Promise<SecondFactorTransaction> {
    const req = new FinalizeProportionalElectionEndResultRequest();
    req.setProportionalElectionId(proportionalElectionId);
    return this.request(
      c => c.prepareFinalizeEndResult,
      req,
      r => r,
    );
  }

  public finalizeEndResult(proportionalElectionId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new FinalizeProportionalElectionEndResultRequest();
    req.setProportionalElectionId(proportionalElectionId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.finalizeEndResult, req);
  }

  public revertEndResultFinalization(proportionalElectionId: string): Promise<void> {
    const req = new RevertProportionalElectionEndResultFinalizationRequest();
    req.setProportionalElectionId(proportionalElectionId);
    return this.requestEmptyResp(c => c.revertEndResultFinalization, req);
  }

  public validateEnterCountOfVoters(
    electionResultId: string,
    countOfVoters: PoliticalBusinessNullableCountOfVoters,
  ): Promise<ValidationSummary> {
    const req = new ValidateEnterProportionalElectionCountOfVotersRequest();
    req.setRequest(this.mapToEnterCountOfVotersRequest(electionResultId, countOfVoters));
    return this.request(
      c => c.validateEnterCountOfVoters,
      req,
      r => this.validationMapping.mapToValidationSummary(r),
    );
  }

  public enterManualListEndResult(listId: string, candidateEndResults: ProportionalElectionManualCandidateEndResult[]): Promise<void> {
    const req = new EnterProportionalElectionManualListEndResultRequest();
    req.setProportionalElectionListId(listId);
    req.setCandidateEndResultsList(candidateEndResults.map(x => this.mapToEnterManualCandidateEndResultRequest(x)));
    return this.requestEmptyResp(c => c.enterManualListEndResult, req);
  }

  private mapToUnmodifiedListResults(proto: ProportionalElectionUnmodifiedListResultsProto): ProportionalElectionUnmodifiedListResults {
    return {
      electionResult: ProportionalElectionResultService.mapToProportionalElectionResult(proto.getElectionResult()!),
      unmodifiedListResults: proto.getUnmodifiedListResultsList().map(x => this.mapToUnmodifiedListResult(x)),
    };
  }

  private mapToUnmodifiedListResult(proto: ProportionalElectionUnmodifiedListResultProto): ProportionalElectionUnmodifiedListResult {
    return {
      conventionalVoteCount: proto.getConventionalVoteCount(),
      list: proto.getList()!.toObject(),
    };
  }

  private mapToProportionalElectionEndResult(data: ProportionalElectionEndResultProto): ProportionalElectionEndResult {
    return {
      contest: ContestService.mapToContest(data.getContest()!),
      election: ProportionalElectionService.mapToElection(data.getProportionalElection()!),
      countOfVotersInformation: ContestCountingCircleDetailsService.mapToCountOfVotersInformation(data.getCountOfVotersInformation()!),
      votingCards: data.getVotingCardsList().map(v => ContestCountingCircleDetailsService.mapToVotingCard(v)),
      countOfDoneCountingCircles: data.getCountOfDoneCountingCircles(),
      totalCountOfCountingCircles: data.getTotalCountOfCountingCircles(),
      allCountingCirclesDone: data.getAllCountingCirclesDone(),
      countOfVoters: data.getCountOfVoters()!.toObject(),
      listEndResults: this.mapToListEndResults(data.getListEndResultsList()),
      finalized: data.getFinalized(),
      manualEndResultRequired: data.getManualEndResultRequired(),
    };
  }

  private mapToListEndResults(data: ProportionalElectionListEndResultProto[]): ProportionalElectionListEndResult[] {
    return data.map(x => ({
      list: x.getList()!.toObject(),
      numberOfMandates: x.getNumberOfMandates(),
      listVotesCount: x.getListVotesCount(),
      blankRowsCount: x.getBlankRowsCount(),
      totalVoteCount: x.getTotalVoteCount(),
      candidateEndResults: this.mapToCandidateEndResults(x.getCandidateEndResultsList()),
      listUnion: x.getListUnion()?.toObject(),
      subListUnion: x.getSubListUnion()?.toObject(),
      hasOpenRequiredLotDecisions: x.getHasOpenRequiredLotDecisions(),
      eVotingSubTotal: x.getEVotingSubTotal()!.toObject(),
      conventionalSubTotal: x.getConventionalSubTotal()!.toObject(),
    }));
  }

  private mapToCandidateEndResults(data: ProportionalElectionCandidateEndResultProto[]): ProportionalElectionCandidateEndResult[] {
    return data.map(x => ({
      candidate: x.getCandidate()!.toObject(),
      voteCount: x.getVoteCount(),
      rank: x.getRank(),
      lotDecision: x.getLotDecision(),
      lotDecisionEnabled: x.getLotDecisionEnabled(),
      state: x.getState(),
      lotDecisionRequired: x.getLotDecisionRequired(),
      eVotingSubTotal: x.getEVotingSubTotal()!.toObject(),
      conventionalSubTotal: x.getConventionalSubTotal()!.toObject(),
    }));
  }

  private mapToUpdateLotDecisionRequest(data: ProportionalElectionEndResultLotDecision): ProportionalElectionEndResultLotDecisionProto {
    const request = new UpdateProportionalElectionEndResultLotDecisionRequest();
    request.setCandidateId(data.candidateId);
    request.setRank(data.rank);
    return request;
  }

  private mapToProportionalElectionEndResultAvailableLotDecisions(
    data: ProportionalElectionListEndResultAvailableLotDecisionsProto,
  ): ProportionalElectionListEndResultAvailableLotDecisions {
    return {
      listId: data.getProportionalElectionListId(),
      lotDecisions: this.mapToAvailableLotDecisions(data.getLotDecisionsList()),
    };
  }

  private mapToAvailableLotDecisions(
    data: ProportionalElectionEndResultAvailableLotDecisionProto[],
  ): ProportionalElectionEndResultAvailableLotDecision[] {
    return data.map(x => ({
      candidate: x.getCandidate()!.toObject(),
      selectedRank: x.getSelectedRank()?.getValue(),
      voteCount: x.getVoteCount(),
      lotDecisionRequired: x.getLotDecisionRequired(),
      selectableRanks: x.getSelectableRanksList(),
      originalRank: x.getOriginalRank(),
    }));
  }

  private mapToEnterCountOfVotersRequest(
    electionResultId: string,
    countOfVoters: PoliticalBusinessNullableCountOfVoters,
  ): EnterProportionalElectionCountOfVotersRequest {
    const req = new EnterProportionalElectionCountOfVotersRequest();
    req.setElectionResultId(electionResultId);
    req.setCountOfVoters(this.mapToCountOfVotersProto(countOfVoters));
    return req;
  }

  private mapToEnterManualCandidateEndResultRequest(
    data: ProportionalElectionManualCandidateEndResult,
  ): EnterProportionalElectionManualCandidateEndResultRequest {
    const req = new EnterProportionalElectionManualCandidateEndResultRequest();
    req.setCandidateId(data.candidate.id);
    req.setState(data.state);
    return req;
  }
}
