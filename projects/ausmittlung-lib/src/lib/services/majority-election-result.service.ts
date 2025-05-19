/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  MajorityElectionResultServiceClient,
  MajorityElectionResultServicePromiseClient,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/majority_election_result_service_grpc_web_pb';
import { SecondaryMajorityElectionResult } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/majority_election_result_pb';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import {
  DefineMajorityElectionResultEntryParamsRequest,
  DefineMajorityElectionResultEntryRequest,
  EnterMajorityElectionBallotGroupResultRequest,
  EnterMajorityElectionBallotGroupResultsRequest,
  EnterMajorityElectionCandidateResultRequest,
  EnterMajorityElectionCandidateResultsRequest,
  EnterMajorityElectionCountOfVotersRequest,
  EnterSecondaryMajorityElectionCandidateResultsRequest,
  FinalizeMajorityElectionEndResultRequest,
  GetMajorityElectionBallotGroupResultsRequest,
  GetMajorityElectionEndResultAvailableLotDecisionsRequest,
  GetMajorityElectionEndResultRequest,
  GetMajorityElectionPartialEndResultRequest,
  GetMajorityElectionResultRequest,
  MajorityElectionResultAuditedTentativelyRequest,
  MajorityElectionResultCorrectionFinishedAndAuditedTentativelyRequest,
  MajorityElectionResultCorrectionFinishedRequest,
  MajorityElectionResultFlagForCorrectionRequest,
  MajorityElectionResultPrepareCorrectionFinishedRequest,
  MajorityElectionResultPrepareSubmissionFinishedRequest,
  MajorityElectionResultPublishRequest,
  MajorityElectionResultResetToSubmissionFinishedAndFlagForCorrectionRequest,
  MajorityElectionResultResetToSubmissionFinishedRequest,
  MajorityElectionResultsPlausibiliseRequest,
  MajorityElectionResultsResetToAuditedTentativelyRequest,
  MajorityElectionResultSubmissionFinishedAndAuditedTentativelyRequest,
  MajorityElectionResultSubmissionFinishedRequest,
  RevertMajorityElectionEndResultFinalizationRequest,
  UpdateMajorityElectionEndResultLotDecisionRequest,
  UpdateMajorityElectionEndResultLotDecisionsRequest,
  UpdateMajorityElectionEndResultSecondaryLotDecisionsRequest,
  ValidateEnterMajorityElectionCandidateResultsRequest,
  ValidateEnterMajorityElectionCountOfVotersRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/majority_election_result_requests_pb';
import { GrpcBackendService, GrpcEnvironment } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MajorityElectionBallotGroupResult,
  MajorityElectionBallotGroupResults,
  MajorityElectionCandidateResult,
  MajorityElectionCandidateResultProto,
  MajorityElectionResult,
  MajorityElectionResultEntry,
  MajorityElectionResultEntryParams,
  MajorityElectionResultProto,
  mapToCountOfVoters,
  mapToNullableCountOfVoters,
  PoliticalBusinessNullableCountOfVoters,
  ValidationSummary,
} from '../models';
import {
  MajorityElectionCandidateEndResult,
  MajorityElectionCandidateEndResultProto,
  MajorityElectionEndResult,
  MajorityElectionEndResultAvailableLotDecision,
  MajorityElectionEndResultAvailableLotDecisionProto,
  MajorityElectionEndResultAvailableLotDecisions,
  MajorityElectionEndResultAvailableLotDecisionsProto,
  MajorityElectionEndResultLotDecision,
  MajorityElectionEndResultProto,
  SecondaryMajorityElectionEndResult,
  SecondaryMajorityElectionEndResultAvailableLotDecisions,
  SecondaryMajorityElectionEndResultAvailableLotDecisionsProto,
  SecondaryMajorityElectionEndResultProto,
} from '../models/majority-election-end-result.model';
import {
  MajorityElectionBallotGroupResultsProto,
  MajorityElectionResultNullableSubTotal,
  MajorityElectionResultNullableSubTotalProto,
} from '../models/majority-election-result.model';
import { ContestCountingCircleDetailsService } from './contest-counting-circle-details.service';
import { ContestService } from './contest.service';
import { MajorityElectionService } from './majority-election.service';
import { PoliticalBusinessResultBaseService } from './political-business-result-base.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { createInt32Value } from './utils/proto.utils';
import { ValidationMappingService } from './validation-mapping.service';
import { ElectionLotDecisionService } from './election-lot-decision.service';

@Injectable({
  providedIn: 'root',
})
export class MajorityElectionResultService extends PoliticalBusinessResultBaseService<
  MajorityElectionResult,
  MajorityElectionResultServicePromiseClient,
  MajorityElectionResultServiceClient
> {
  constructor(
    grpcBackend: GrpcBackendService,
    @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment,
    private readonly validationMapping: ValidationMappingService,
    private readonly electionLotDecisionService: ElectionLotDecisionService,
  ) {
    super(MajorityElectionResultServicePromiseClient, MajorityElectionResultServiceClient, env, grpcBackend);
  }

  public static mapToMajorityElectionResult(majorityElectionResult: MajorityElectionResultProto): MajorityElectionResult {
    const obj = majorityElectionResult.toObject();
    return {
      ...(obj as Required<MajorityElectionResultProto.AsObject>),
      politicalBusinessId: obj.election!.id,
      politicalBusiness: {
        ...MajorityElectionService.mapToElection(majorityElectionResult.getElection()!),
        politicalBusinessType: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION,
      },
      countingCircle: obj.countingCircle!,
      entry: obj.entry,
      hasUnmappedWriteIns: obj.hasUnmappedWriteIns,
      election: MajorityElectionService.mapToElection(majorityElectionResult.getElection()!),
      countOfVoters: mapToNullableCountOfVoters(obj.countOfVoters!),
      candidateResults: obj.candidateResultsList.map(x => ({
        ...(x as Required<MajorityElectionCandidateResultProto.AsObject>),
        conventionalVoteCount: x.conventionalVoteCount?.value,
      })),
      conventionalSubTotal: MajorityElectionResultService.mapToNullableSubTotal(majorityElectionResult.getConventionalSubTotal()!),
      secondaryMajorityElectionResults: majorityElectionResult.getSecondaryMajorityElectionResultsList().map(ser => ({
        ...(ser.toObject()! as Required<SecondaryMajorityElectionResult.AsObject>),
        election: ser.getSecondaryMajorityElection()!.toObject(),
        conventionalSubTotal: MajorityElectionResultService.mapToNullableSubTotal(ser.getConventionalSubTotal()!),
        candidateResults: ser.getCandidateResultsList().map(r => ({
          ...(r.toObject()! as Required<MajorityElectionCandidateResultProto.AsObject>),
          conventionalVoteCount: r.getConventionalVoteCount()?.getValue(),
        })),
      })),
    };
  }

  private static mapToNullableSubTotal(data: MajorityElectionResultNullableSubTotalProto): MajorityElectionResultNullableSubTotal {
    const protoObj = data.toObject();
    return {
      ...protoObj,
      emptyVoteCountInclWriteIns: protoObj.emptyVoteCountInclWriteIns?.value,
      emptyVoteCountExclWriteIns: protoObj.emptyVoteCountExclWriteIns?.value,
      emptyVoteCountWriteIns: protoObj.emptyVoteCountWriteIns?.value,
      invalidVoteCount: protoObj.invalidVoteCount?.value,
      individualVoteCount: protoObj.individualVoteCount?.value,
    };
  }

  public get(electionId: string, countingCircleId: string): Promise<MajorityElectionResult> {
    const req = new GetMajorityElectionResultRequest();
    req.setCountingCircleId(countingCircleId);
    req.setElectionId(electionId);
    return this.request(
      c => c.get,
      req,
      r => MajorityElectionResultService.mapToMajorityElectionResult(r),
    );
  }

  public getByResultId(electionResultId: string): Promise<MajorityElectionResult> {
    const req = new GetMajorityElectionResultRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.get,
      req,
      r => MajorityElectionResultService.mapToMajorityElectionResult(r),
    );
  }

  public getBallotGroups(electionResultId: string): Promise<MajorityElectionBallotGroupResults> {
    const req = new GetMajorityElectionBallotGroupResultsRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.getBallotGroups,
      req,
      r => this.mapToBallotGroups(r),
    );
  }

  public defineEntry(
    electionResultId: string,
    resultEntry: MajorityElectionResultEntry,
    resultEntryParams: MajorityElectionResultEntryParams,
  ): Promise<void> {
    const req = new DefineMajorityElectionResultEntryRequest();
    req.setElectionResultId(electionResultId);
    req.setResultEntry(resultEntry);

    if (resultEntry === MajorityElectionResultEntry.MAJORITY_ELECTION_RESULT_ENTRY_DETAILED) {
      const resultEntryParamsReq = new DefineMajorityElectionResultEntryParamsRequest();
      resultEntryParamsReq.setAutomaticBallotBundleNumberGeneration(resultEntryParams.automaticBallotBundleNumberGeneration);
      resultEntryParamsReq.setAutomaticEmptyVoteCounting(resultEntryParams.automaticEmptyVoteCounting);
      resultEntryParamsReq.setBallotBundleSampleSize(resultEntryParams.ballotBundleSampleSize);
      resultEntryParamsReq.setBallotBundleSize(resultEntryParams.ballotBundleSize);
      resultEntryParamsReq.setBallotNumberGeneration(resultEntryParams.ballotNumberGeneration);
      resultEntryParamsReq.setReviewProcedure(resultEntryParams.reviewProcedure);
      resultEntryParamsReq.setCandidateCheckDigit(resultEntryParams.candidateCheckDigit);
      req.setResultEntryParams(resultEntryParamsReq);
    }
    return this.requestEmptyResp(c => c.defineEntry, req);
  }

  public async enterCountOfVoters(electionResultId: string, countOfVoters: PoliticalBusinessNullableCountOfVoters): Promise<void> {
    const req = this.mapToEnterCountOfVotersRequest(electionResultId, countOfVoters);
    await this.requestEmptyResp(c => c.enterCountOfVoters, req);
  }

  public async enterCandidateResults(result: MajorityElectionResult): Promise<void> {
    const req = this.mapToEnterCandidateResultsRequest(result);
    await this.requestEmptyResp(c => c.enterCandidateResults, req);
  }

  public async enterBallotGroupResults(electionResultId: string, ballotGroupResults: MajorityElectionBallotGroupResult[]): Promise<void> {
    const req = new EnterMajorityElectionBallotGroupResultsRequest();
    req.setElectionResultId(electionResultId);
    req.setResultsList(
      ballotGroupResults.map(bg => {
        const r = new EnterMajorityElectionBallotGroupResultRequest();
        r.setBallotGroupId(bg.ballotGroup.id);
        r.setVoteCount(bg.voteCount);
        return r;
      }),
    );
    await this.requestEmptyResp(c => c.enterBallotGroupResults, req);
  }

  public async prepareSubmissionFinished(majorityElectionResultId: string): Promise<SecondFactorTransaction> {
    const req = new MajorityElectionResultPrepareSubmissionFinishedRequest();
    req.setElectionResultId(majorityElectionResultId);
    return await this.request(
      c => c.prepareSubmissionFinished,
      req,
      r => r,
    );
  }

  public submissionFinished(majorityElectionResultId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new MajorityElectionResultSubmissionFinishedRequest();
    req.setElectionResultId(majorityElectionResultId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.submissionFinished, req);
  }

  public async resetToSubmissionFinished(majorityElectionResultId: string): Promise<void> {
    const req = new MajorityElectionResultResetToSubmissionFinishedRequest();
    req.setElectionResultId(majorityElectionResultId);
    await this.requestEmptyResp(c => c.resetToSubmissionFinished, req);
  }

  public async prepareCorrectionFinished(majorityElectionResultId: string): Promise<SecondFactorTransaction> {
    const req = new MajorityElectionResultPrepareCorrectionFinishedRequest();
    req.setElectionResultId(majorityElectionResultId);
    return await this.request(
      c => c.prepareCorrectionFinished,
      req,
      r => r,
    );
  }

  public correctionFinished(majorityElectionResultId: string, comment: string, secondFactorTransactionId: string): Observable<void> {
    const req = new MajorityElectionResultCorrectionFinishedRequest();
    req.setElectionResultId(majorityElectionResultId);
    req.setComment(comment);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.correctionFinished, req);
  }

  public async flagForCorrection(majorityElectionResultId: string, comment: string): Promise<void> {
    const req = new MajorityElectionResultFlagForCorrectionRequest();
    req.setElectionResultId(majorityElectionResultId);
    req.setComment(comment);
    await this.requestEmptyResp(c => c.flagForCorrection, req);
  }

  public async auditedTentatively(majorityElectionResultIds: string[]): Promise<void> {
    const req = new MajorityElectionResultAuditedTentativelyRequest();
    req.setElectionResultIdsList(majorityElectionResultIds);
    await this.requestEmptyResp(c => c.auditedTentatively, req);
  }

  public async plausibilise(majorityElectionResultIds: string[]): Promise<void> {
    const req = new MajorityElectionResultsPlausibiliseRequest();
    req.setElectionResultIdsList(majorityElectionResultIds);
    await this.requestEmptyResp(c => c.plausibilise, req);
  }

  public async resetToAuditedTentatively(majorityElectionResultIds: string[]): Promise<void> {
    const req = new MajorityElectionResultsResetToAuditedTentativelyRequest();
    req.setElectionResultIdsList(majorityElectionResultIds);
    await this.requestEmptyResp(c => c.resetToAuditedTentatively, req);
  }

  public submissionFinishedAndAuditedTentatively(majorityElectionResultId: string): Promise<void> {
    const req = new MajorityElectionResultSubmissionFinishedAndAuditedTentativelyRequest();
    req.setElectionResultId(majorityElectionResultId);
    return this.requestEmptyResp(c => c.submissionFinishedAndAuditedTentatively, req);
  }

  public correctionFinishedAndAuditedTentatively(majorityElectionResultId: string): Promise<void> {
    const req = new MajorityElectionResultCorrectionFinishedAndAuditedTentativelyRequest();
    req.setElectionResultId(majorityElectionResultId);
    return this.requestEmptyResp(c => c.correctionFinishedAndAuditedTentatively, req);
  }

  public publish(majorityElectionResultIds: string[]): Promise<void> {
    const req = new MajorityElectionResultPublishRequest();
    req.setElectionResultIdsList(majorityElectionResultIds);
    return this.requestEmptyResp(c => c.publish, req);
  }

  public unpublish(majorityElectionResultIds: string[]): Promise<void> {
    const req = new MajorityElectionResultPublishRequest();
    req.setElectionResultIdsList(majorityElectionResultIds);
    return this.requestEmptyResp(c => c.unpublish, req);
  }

  public getPartialEndResult(majorityElectionId: string): Promise<MajorityElectionEndResult> {
    const req = new GetMajorityElectionPartialEndResultRequest();
    req.setMajorityElectionId(majorityElectionId);
    return this.request(
      c => c.getPartialEndResult,
      req,
      r => this.mapToMajorityElectionEndResult(r),
    );
  }

  public getEndResult(majorityElectionId: string): Promise<MajorityElectionEndResult> {
    const req = new GetMajorityElectionEndResultRequest();
    req.setMajorityElectionId(majorityElectionId);
    return this.request(
      c => c.getEndResult,
      req,
      r => this.mapToMajorityElectionEndResult(r),
    );
  }

  public getEndResultAvailableLotDecisions(majorityElectionId: string): Promise<MajorityElectionEndResultAvailableLotDecisions> {
    const req = new GetMajorityElectionEndResultAvailableLotDecisionsRequest();
    req.setMajorityElectionId(majorityElectionId);
    return this.request(
      c => c.getEndResultAvailableLotDecisions,
      req,
      r => this.mapToMajorityElectionEndResultAvailableLotDecisions(r),
    );
  }

  public updateEndResultLotDecisions(majorityElectionId: string, lotDecisions: MajorityElectionEndResultLotDecision[]): Promise<void> {
    const req = new UpdateMajorityElectionEndResultLotDecisionsRequest();
    req.setMajorityElectionId(majorityElectionId);
    req.setLotDecisionsList(lotDecisions.map(x => this.mapToUpdateLotDecisionRequest(x)));
    return this.requestEmptyResp(c => c.updateEndResultLotDecisions, req);
  }

  public updateEndResultSecondaryLotDecisions(
    majorityElectionId: string,
    lotDecisions: MajorityElectionEndResultLotDecision[],
  ): Promise<void> {
    const req = new UpdateMajorityElectionEndResultSecondaryLotDecisionsRequest();
    req.setMajorityElectionId(majorityElectionId);
    req.setLotDecisionsList(lotDecisions.map(x => this.mapToUpdateLotDecisionRequest(x)));
    return this.requestEmptyResp(c => c.updateEndResultSecondaryLotDecisions, req);
  }

  public prepareFinalizeEndResult(majorityElectionId: string): Promise<SecondFactorTransaction> {
    const req = new FinalizeMajorityElectionEndResultRequest();
    req.setMajorityElectionId(majorityElectionId);
    return this.request(
      c => c.prepareFinalizeEndResult,
      req,
      r => r,
    );
  }

  public finalizeEndResult(majorityElectionId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new FinalizeMajorityElectionEndResultRequest();
    req.setMajorityElectionId(majorityElectionId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.finalizeEndResult, req);
  }

  public revertEndResultFinalization(majorityElectionId: string): Promise<void> {
    const req = new RevertMajorityElectionEndResultFinalizationRequest();
    req.setMajorityElectionId(majorityElectionId);
    return this.requestEmptyResp(c => c.revertEndResultFinalization, req);
  }

  public validateEnterCountOfVoters(
    electionResultId: string,
    countOfVoters: PoliticalBusinessNullableCountOfVoters,
  ): Promise<ValidationSummary> {
    const req = new ValidateEnterMajorityElectionCountOfVotersRequest();
    req.setRequest(this.mapToEnterCountOfVotersRequest(electionResultId, countOfVoters));
    return this.request(
      c => c.validateEnterCountOfVoters,
      req,
      r => this.validationMapping.mapToValidationSummary(r),
    );
  }

  public validateEnterCandidateResults(result: MajorityElectionResult): Promise<ValidationSummary> {
    const req = new ValidateEnterMajorityElectionCandidateResultsRequest();
    req.setRequest(this.mapToEnterCandidateResultsRequest(result));
    return this.request(
      c => c.validateEnterCandidateResults,
      req,
      r => this.validationMapping.mapToValidationSummary(r),
    );
  }

  public async resetToSubmissionFinishedAndFlagForCorrection(majorityElectionResultId: string): Promise<void> {
    const req = new MajorityElectionResultResetToSubmissionFinishedAndFlagForCorrectionRequest();
    req.setElectionResultId(majorityElectionResultId);
    await this.requestEmptyResp(c => c.resetToSubmissionFinishedAndFlagForCorrection, req);
  }

  private mapToBallotGroups(proto: MajorityElectionBallotGroupResultsProto): MajorityElectionBallotGroupResults {
    const obj = proto.toObject();
    return {
      electionResult: MajorityElectionResultService.mapToMajorityElectionResult(proto.getElectionResult()!),
      ballotGroupResults: obj.ballotGroupResultsList.map(x => ({
        voteCount: x.voteCount,
        ballotGroup: {
          ...x.ballotGroup!,
          entries: x.ballotGroup!.entriesList.map(y => ({
            election: (y.election || y.secondaryElection)!,
            candidates: y.candidatesList,
            individualCandidatesVoteCount: y.individualCandidatesVoteCount,
          })),
        },
      })),
    };
  }

  private mapToCandidateResultProto(result: MajorityElectionCandidateResult): EnterMajorityElectionCandidateResultRequest {
    const req = new EnterMajorityElectionCandidateResultRequest();
    req.setCandidateId(result.candidate.id);
    req.setVoteCount(createInt32Value(result.conventionalVoteCount));
    return req;
  }

  private mapToMajorityElectionEndResult(data: MajorityElectionEndResultProto): MajorityElectionEndResult {
    return {
      contest: ContestService.mapToContest(data.getContest()!),
      election: MajorityElectionService.mapToElection(data.getMajorityElection()!),
      countOfVotersInformation: ContestCountingCircleDetailsService.mapToCountOfVotersInformation(data.getCountOfVotersInformation()!),
      votingCards: data.getVotingCardsList().map(v => ContestCountingCircleDetailsService.mapToVotingCard(v)),
      countOfDoneCountingCircles: data.getCountOfDoneCountingCircles(),
      totalCountOfCountingCircles: data.getTotalCountOfCountingCircles(),
      allCountingCirclesDone: data.getAllCountingCirclesDone(),
      countOfVoters: mapToCountOfVoters(data.getCountOfVoters()!.toObject()),
      candidateEndResults: this.mapToCandidateEndResults(data.getCandidateEndResultsList()),
      secondaryMajorityElectionEndResults: this.mapToSecondaryMajorityElectionEndResults(data.getSecondaryMajorityElectionEndResultsList()),
      individualVoteCount: data.getIndividualVoteCount(),
      emptyVoteCount: data.getEmptyVoteCount(),
      invalidVoteCount: data.getInvalidVoteCount(),
      totalCandidateVoteCountExclIndividual: data.getTotalCandidateVoteCountExclIndividual(),
      totalCandidateVoteCountInclIndividual: data.getTotalCandidateVoteCountInclIndividual(),
      finalized: data.getFinalized(),
      eVotingSubTotal: data.getEVotingSubTotal()!.toObject(),
      eCountingSubTotal: data.getECountingSubTotal()!.toObject(),
      conventionalSubTotal: data.getConventionalSubTotal()!.toObject(),
    };
  }

  private mapToCandidateEndResults(data: MajorityElectionCandidateEndResultProto[]): MajorityElectionCandidateEndResult[] {
    return data.map(x => ({
      candidate: x.getCandidate()!.toObject(),
      voteCount: x.getVoteCount(),
      conventionalVoteCount: x.getConventionalVoteCount(),
      eVotingVoteCount: x.getEVotingVoteCount(),
      eCountingVoteCount: x.getECountingVoteCount(),
      rank: x.getRank(),
      lotDecision: x.getLotDecision(),
      lotDecisionEnabled: x.getLotDecisionEnabled(),
      state: x.getState(),
      lotDecisionRequired: x.getLotDecisionRequired(),
    }));
  }

  private mapToSecondaryMajorityElectionEndResults(data: SecondaryMajorityElectionEndResultProto[]): SecondaryMajorityElectionEndResult[] {
    return data.map(x => ({
      election: x.getSecondaryMajorityElection()!.toObject(),
      candidateEndResults: this.mapToCandidateEndResults(x.getCandidateEndResultsList()),
      individualVoteCount: x.getIndividualVoteCount(),
      emptyVoteCount: x.getEmptyVoteCount(),
      invalidVoteCount: x.getInvalidVoteCount(),
      totalCandidateVoteCountInclIndividual: x.getTotalCandidateVoteCountInclIndividual(),
      totalCandidateVoteCountExclIndividual: x.getTotalCandidateVoteCountExclIndividual(),
      eVotingSubTotal: x.getEVotingSubTotal()!.toObject(),
      eCountingSubTotal: x.getECountingSubTotal()!.toObject(),
      conventionalSubTotal: x.getConventionalSubTotal()!.toObject(),
    }));
  }

  private mapToUpdateLotDecisionRequest(data: MajorityElectionEndResultLotDecision): UpdateMajorityElectionEndResultLotDecisionRequest {
    const request = new UpdateMajorityElectionEndResultLotDecisionRequest();
    request.setCandidateId(data.candidateId);
    request.setRank(data.rank === 0 ? undefined : createInt32Value(data.rank));
    return request;
  }

  private mapToMajorityElectionEndResultAvailableLotDecisions(
    data: MajorityElectionEndResultAvailableLotDecisionsProto,
  ): MajorityElectionEndResultAvailableLotDecisions {
    return {
      election: MajorityElectionService.mapToElection(data.getMajorityElection()!),
      lotDecisions: this.mapToAvailableLotDecisions(data.getLotDecisionsList()),
      secondaryLotDecisions: this.mapToSecondaryMajorityElectionEndResultAvailableLotDecisions(data.getSecondaryLotDecisionsList()),
    };
  }

  private mapToAvailableLotDecisions(
    data: MajorityElectionEndResultAvailableLotDecisionProto[],
  ): MajorityElectionEndResultAvailableLotDecision[] {
    return data.map(x => ({
      candidate: x.getCandidate()!.toObject(),
      selectedRank: x.getSelectedRank()?.getValue() ?? 0,
      voteCount: x.getVoteCount(),
      lotDecisionRequired: x.getLotDecisionRequired(),
      selectableRanks: this.electionLotDecisionService.buildSelectableRank(x.getSelectableRanksList()),
      originalRank: x.getOriginalRank(),
    }));
  }

  private mapToSecondaryMajorityElectionEndResultAvailableLotDecisions(
    data: SecondaryMajorityElectionEndResultAvailableLotDecisionsProto[],
  ): SecondaryMajorityElectionEndResultAvailableLotDecisions[] {
    return data.map(x => ({
      election: x.getSecondaryMajorityElection()!.toObject(),
      lotDecisions: this.mapToAvailableLotDecisions(x.getLotDecisionsList()),
    }));
  }

  private mapToEnterCountOfVotersRequest(
    electionResultId: string,
    countOfVoters: PoliticalBusinessNullableCountOfVoters,
  ): EnterMajorityElectionCountOfVotersRequest {
    const req = new EnterMajorityElectionCountOfVotersRequest();
    req.setElectionResultId(electionResultId);
    req.setCountOfVoters(this.mapToCountOfVotersProto(countOfVoters));
    return req;
  }

  private mapToEnterCandidateResultsRequest(result: MajorityElectionResult): EnterMajorityElectionCandidateResultsRequest {
    const req = new EnterMajorityElectionCandidateResultsRequest();
    req.setElectionResultId(result.id);
    req.setCountOfVoters(this.mapToCountOfVotersProto(result.countOfVoters));
    req.setCandidateResultsList(result.candidateResults.map(x => this.mapToCandidateResultProto(x)));
    req.setIndividualVoteCount(createInt32Value(result.conventionalSubTotal.individualVoteCount));
    req.setEmptyVoteCount(createInt32Value(result.conventionalSubTotal.emptyVoteCountExclWriteIns));
    req.setInvalidVoteCount(createInt32Value(result.conventionalSubTotal.invalidVoteCount));
    req.setSecondaryElectionCandidateResultsList(
      result.secondaryMajorityElectionResults.map(x => {
        const candidateReq = new EnterSecondaryMajorityElectionCandidateResultsRequest();
        candidateReq.setIndividualVoteCount(createInt32Value(x.conventionalSubTotal.individualVoteCount));
        candidateReq.setEmptyVoteCount(createInt32Value(x.conventionalSubTotal.emptyVoteCountExclWriteIns));
        candidateReq.setInvalidVoteCount(createInt32Value(x.conventionalSubTotal.invalidVoteCount));
        candidateReq.setSecondaryMajorityElectionId(x.election.id);
        candidateReq.setCandidateResultsList(x.candidateResults.map(y => this.mapToCandidateResultProto(y)));
        return candidateReq;
      }),
    );
    return req;
  }
}
