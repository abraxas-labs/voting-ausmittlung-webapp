/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import {
  DefineVoteResultEntryParamsRequest,
  DefineVoteResultEntryRequest,
  EnterVoteBallotQuestionResultRequest,
  EnterVoteBallotResultsCountOfVotersRequest,
  EnterVoteBallotResultsRequest,
  EnterVoteResultCorrectionRequest,
  EnterVoteResultCountOfVotersRequest,
  EnterVoteResultsRequest,
  EnterVoteTieBreakQuestionResultRequest,
  FinalizeVoteEndResultRequest,
  GetBallotResultRequest,
  GetVoteEndResultRequest,
  GetVotePartialEndResultRequest,
  GetVoteResultRequest,
  PrepareFinalizeVoteEndResultRequest,
  RevertVoteEndResultFinalizationRequest,
  ValidateEnterVoteResultCorrectionRequest,
  ValidateEnterVoteResultCountOfVotersRequest,
  ValidateEnterVoteResultsRequest,
  VoteResultAuditedTentativelyRequest,
  VoteResultCorrectionFinishedAndAuditedTentativelyRequest,
  VoteResultCorrectionFinishedRequest,
  VoteResultFlagForCorrectionRequest,
  VoteResultPrepareCorrectionFinishedRequest,
  VoteResultPrepareSubmissionFinishedRequest,
  VoteResultPublishRequest,
  VoteResultResetToSubmissionFinishedAndFlagForCorrectionRequest,
  VoteResultResetToSubmissionFinishedRequest,
  VoteResultsPlausibiliseRequest,
  VoteResultsResetToAuditedTentativelyRequest,
  VoteResultSubmissionFinishedAndAuditedTentativelyRequest,
  VoteResultSubmissionFinishedRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/vote_result_requests_pb';
import {
  VoteResultServiceClient,
  VoteResultServicePromiseClient,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/vote_result_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BallotEndResult,
  BallotEndResultProto,
  BallotQuestionEndResult,
  BallotQuestionEndResultProto,
  BallotQuestionResult,
  BallotQuestionResultNullableSubTotalProto,
  BallotQuestionResultProto,
  BallotQuestionResultSubTotalProto,
  BallotResult,
  BallotResultProto,
  mapToCountOfVoters,
  mapToNullableCountOfVoters,
  QuestionResultNullableSubTotal,
  QuestionResultSubTotal,
  TieBreakQuestionEndResult,
  TieBreakQuestionEndResultProto,
  TieBreakQuestionResult,
  TieBreakQuestionResultNullableSubTotalProto,
  TieBreakQuestionResultProto,
  TieBreakQuestionResultSubTotalProto,
  ValidationSummary,
  Vote,
  VoteEndResult,
  VoteEndResultProto,
  VoteProto,
  VoteResult,
  VoteResultEntry,
  VoteResultEntryParams,
  VoteResultProto,
} from '../models';
import { ContestCountingCircleDetailsService } from './contest-counting-circle-details.service';
import { ContestService } from './contest.service';
import { PoliticalBusinessResultBaseService } from './political-business-result-base.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { createInt32Value } from './utils/proto.utils';
import { ValidationMappingService } from './validation-mapping.service';

@Injectable({
  providedIn: 'root',
})
export class VoteResultService extends PoliticalBusinessResultBaseService<
  VoteResult,
  VoteResultServicePromiseClient,
  VoteResultServiceClient
> {
  constructor(
    grpcBackend: GrpcBackendService,
    @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment,
    private readonly validationMapping: ValidationMappingService,
  ) {
    super(VoteResultServicePromiseClient, VoteResultServiceClient, env, grpcBackend);
  }

  public static mapToVoteResult(voteResult: VoteResultProto): VoteResult {
    const obj = voteResult.toObject();
    return {
      ...obj,
      politicalBusinessId: obj.vote!.id,
      politicalBusiness: {
        ...VoteResultService.mapToVote(voteResult.getVote()!),
        politicalBusinessType: PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE,
      },
      vote: VoteResultService.mapToVote(voteResult.getVote()!),
      results: voteResult.getResultsList().map(x => VoteResultService.mapToBallotResult(x)),
      totalCountOfVoters: voteResult.getTotalCountOfVoters(),
      countingCircle: obj.countingCircle!,
    };
  }

  public static mapToBallotResult(ballotResult: BallotResultProto): BallotResult {
    const obj = ballotResult.toObject();
    return {
      ...obj,
      ballot: obj.ballot!,
      countOfVoters: mapToNullableCountOfVoters(obj.countOfVoters!),
      questionResults: ballotResult.getQuestionResultsList().map(x => VoteResultService.mapToBallotQuestionResult(x)),
      tieBreakQuestionResults: ballotResult.getTieBreakQuestionResultsList().map(x => VoteResultService.mapToTieBreakQuestionResult(x)),
    };
  }

  private static mapToBallotQuestionResult(result: BallotQuestionResultProto): BallotQuestionResult {
    const question = result.getQuestion()!.toObject();
    return {
      id: result.getId(),
      question,
      totalCountOfAnswer1: result.getTotalCountOfAnswerYes(),
      totalCountOfAnswer2: result.getTotalCountOfAnswerNo(),
      totalCountOfAnswerUnspecified: result.getTotalCountOfAnswerUnspecified(),
      conventionalSubTotal: VoteResultService.mapToBallotQuestionResultNullableSubTotal(result.getConventionalSubTotal()!),
      eVotingSubTotal: VoteResultService.mapToBallotQuestionResultSubTotal(result.getEVotingSubTotal()!),
      eCountingSubTotal: VoteResultService.mapToBallotQuestionResultSubTotal(result.getECountingSubTotal()!),
    };
  }

  private static mapToTieBreakQuestionResult(result: TieBreakQuestionResultProto): TieBreakQuestionResult {
    const question = result.getQuestion()!.toObject();
    return {
      id: result.getId(),
      question,
      totalCountOfAnswer1: result.getTotalCountOfAnswerQ1(),
      totalCountOfAnswer2: result.getTotalCountOfAnswerQ2(),
      totalCountOfAnswerUnspecified: result.getTotalCountOfAnswerUnspecified(),
      conventionalSubTotal: VoteResultService.mapToTieBreakQuestionResultNullableSubTotal(result.getConventionalSubTotal()!),
      eVotingSubTotal: VoteResultService.mapToTieBreakQuestionResultSubTotal(result.getEVotingSubTotal()!),
      eCountingSubTotal: VoteResultService.mapToTieBreakQuestionResultSubTotal(result.getECountingSubTotal()!),
    };
  }

  private static mapToBallotQuestionResultSubTotal(subTotal: BallotQuestionResultSubTotalProto): QuestionResultSubTotal {
    return {
      totalCountOfAnswer1: subTotal.getTotalCountOfAnswerYes(),
      totalCountOfAnswer2: subTotal.getTotalCountOfAnswerNo(),
      totalCountOfAnswerUnspecified: subTotal.getTotalCountOfAnswerUnspecified(),
    };
  }

  private static mapToBallotQuestionResultNullableSubTotal(
    subTotal: BallotQuestionResultNullableSubTotalProto,
  ): QuestionResultNullableSubTotal {
    return {
      totalCountOfAnswer1: subTotal.getTotalCountOfAnswerYes()?.getValue(),
      totalCountOfAnswer2: subTotal.getTotalCountOfAnswerNo()?.getValue(),
      totalCountOfAnswerUnspecified: subTotal.getTotalCountOfAnswerUnspecified()?.getValue(),
    };
  }

  private static mapToTieBreakQuestionResultSubTotal(subTotal: TieBreakQuestionResultSubTotalProto): QuestionResultSubTotal {
    return {
      totalCountOfAnswer1: subTotal.getTotalCountOfAnswerQ1(),
      totalCountOfAnswer2: subTotal.getTotalCountOfAnswerQ2(),
      totalCountOfAnswerUnspecified: subTotal.getTotalCountOfAnswerUnspecified(),
    };
  }

  private static mapToTieBreakQuestionResultNullableSubTotal(
    subTotal: TieBreakQuestionResultNullableSubTotalProto,
  ): QuestionResultNullableSubTotal {
    return {
      totalCountOfAnswer1: subTotal.getTotalCountOfAnswerQ1()?.getValue(),
      totalCountOfAnswer2: subTotal.getTotalCountOfAnswerQ2()?.getValue(),
      totalCountOfAnswerUnspecified: subTotal.getTotalCountOfAnswerUnspecified()?.getValue(),
    };
  }

  private static mapToVote(proto: VoteProto): Vote {
    const contest = proto.getContest();
    return {
      ...proto.toObject(),
      contest: !contest ? undefined : ContestService.mapToContest(contest),
    };
  }

  public get(voteId: string, countingCircleId: string): Promise<VoteResult> {
    const req = new GetVoteResultRequest();
    req.setCountingCircleId(countingCircleId);
    req.setVoteId(voteId);
    return this.request(
      c => c.get,
      req,
      r => VoteResultService.mapToVoteResult(r),
    );
  }

  public getByResultId(voteResultId: string): Promise<VoteResult> {
    const req = new GetVoteResultRequest();
    req.setVoteResultId(voteResultId);
    return this.request(
      c => c.get,
      req,
      r => VoteResultService.mapToVoteResult(r),
    );
  }

  public async defineEntry(voteResultId: string, resultEntry: VoteResultEntry, resultEntryParams: VoteResultEntryParams): Promise<void> {
    const req = new DefineVoteResultEntryRequest();
    req.setResultEntry(resultEntry);
    req.setVoteResultId(voteResultId);

    if (resultEntry === VoteResultEntry.VOTE_RESULT_ENTRY_DETAILED) {
      const resultEntryParamsReq = new DefineVoteResultEntryParamsRequest();
      resultEntryParamsReq.setAutomaticBallotBundleNumberGeneration(resultEntryParams.automaticBallotBundleNumberGeneration);
      resultEntryParamsReq.setBallotBundleSampleSizePercent(resultEntryParams.ballotBundleSampleSizePercent);
      resultEntryParamsReq.setReviewProcedure(resultEntryParams.reviewProcedure);
      req.setResultEntryParams(resultEntryParamsReq);
    }

    return this.requestEmptyResp(c => c.defineEntry, req);
  }

  public async prepareSubmissionFinished(voteResultId: string): Promise<SecondFactorTransaction> {
    const req = new VoteResultPrepareSubmissionFinishedRequest();
    req.setVoteResultId(voteResultId);
    return await this.request(
      c => c.prepareSubmissionFinished,
      req,
      r => r,
    );
  }

  public submissionFinished(voteResultId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new VoteResultSubmissionFinishedRequest();
    req.setVoteResultId(voteResultId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.submissionFinished, req);
  }

  public async resetToSubmissionFinished(voteResultId: string): Promise<void> {
    const req = new VoteResultResetToSubmissionFinishedRequest();
    req.setVoteResultId(voteResultId);
    await this.requestEmptyResp(c => c.resetToSubmissionFinished, req);
  }

  public async prepareCorrectionFinished(voteResultId: string): Promise<SecondFactorTransaction> {
    const req = new VoteResultPrepareCorrectionFinishedRequest();
    req.setVoteResultId(voteResultId);
    return await this.request(
      c => c.prepareCorrectionFinished,
      req,
      r => r,
    );
  }

  public correctionFinished(voteResultId: string, comment: string, secondFactorTransactionId: string): Observable<void> {
    const req = new VoteResultCorrectionFinishedRequest();
    req.setVoteResultId(voteResultId);
    req.setComment(comment);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.correctionFinished, req);
  }

  public async flagForCorrection(voteResultId: string, comment: string): Promise<void> {
    const req = new VoteResultFlagForCorrectionRequest();
    req.setVoteResultId(voteResultId);
    req.setComment(comment);
    await this.requestEmptyResp(c => c.flagForCorrection, req);
  }

  public async auditedTentatively(voteResultIds: string[]): Promise<void> {
    const req = new VoteResultAuditedTentativelyRequest();
    req.setVoteResultIdsList(voteResultIds);
    await this.requestEmptyResp(c => c.auditedTentatively, req);
  }

  public async plausibilise(voteResultIds: string[]): Promise<void> {
    const req = new VoteResultsPlausibiliseRequest();
    req.setVoteResultIdsList(voteResultIds);
    await this.requestEmptyResp(c => c.plausibilise, req);
  }

  public async resetToAuditedTentatively(voteResultIds: string[]): Promise<void> {
    const req = new VoteResultsResetToAuditedTentativelyRequest();
    req.setVoteResultIdsList(voteResultIds);
    await this.requestEmptyResp(c => c.resetToAuditedTentatively, req);
  }

  public submissionFinishedAndAuditedTentatively(voteResultId: string): Promise<void> {
    const req = new VoteResultSubmissionFinishedAndAuditedTentativelyRequest();
    req.setVoteResultId(voteResultId);
    return this.requestEmptyResp(c => c.submissionFinishedAndAuditedTentatively, req);
  }

  public correctionFinishedAndAuditedTentatively(voteResultId: string): Promise<void> {
    const req = new VoteResultCorrectionFinishedAndAuditedTentativelyRequest();
    req.setVoteResultId(voteResultId);
    return this.requestEmptyResp(c => c.correctionFinishedAndAuditedTentatively, req);
  }

  public publish(voteResultIds: string[]): Promise<void> {
    const req = new VoteResultPublishRequest();
    req.setVoteResultIdsList(voteResultIds);
    return this.requestEmptyResp(c => c.publish, req);
  }

  public unpublish(voteResultIds: string[]): Promise<void> {
    const req = new VoteResultPublishRequest();
    req.setVoteResultIdsList(voteResultIds);
    return this.requestEmptyResp(c => c.unpublish, req);
  }

  public async enterCountOfVoters(voteResult: VoteResult): Promise<void> {
    const req = this.mapToEnterCountOfVotersRequest(voteResult);
    await this.requestEmptyResp(c => c.enterCountOfVoters, req);
  }

  public async enterResults(voteResult: VoteResult): Promise<void> {
    const req = this.mapToEnterResultsRequest(voteResult);
    await this.requestEmptyResp(c => c.enterResults, req);
  }

  public async enterCorrectionResults(voteResult: VoteResult): Promise<void> {
    const req = this.mapToEnterCorrectionResultsRequest(voteResult);
    await this.requestEmptyResp(c => c.enterCorrectionResults, req);
  }

  public getPartialEndResult(voteId: string): Promise<VoteEndResult> {
    const req = new GetVotePartialEndResultRequest();
    req.setVoteId(voteId);
    return this.request(
      c => c.getPartialEndResult,
      req,
      r => this.mapToVoteEndResult(r),
    );
  }

  public getEndResult(voteId: string): Promise<VoteEndResult> {
    const req = new GetVoteEndResultRequest();
    req.setVoteId(voteId);
    return this.request(
      c => c.getEndResult,
      req,
      r => this.mapToVoteEndResult(r),
    );
  }

  public prepareFinalizeEndResult(voteId: string): Promise<SecondFactorTransaction> {
    const req = new PrepareFinalizeVoteEndResultRequest();
    req.setVoteId(voteId);
    return this.request(
      c => c.prepareFinalizeEndResult,
      req,
      r => r,
    );
  }

  public finalizeEndResult(voteId: string, secondFactorTransactionId: string): Observable<void> {
    const req = new FinalizeVoteEndResultRequest();
    req.setVoteId(voteId);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.finalizeEndResult, req);
  }

  public revertEndResultFinalization(voteId: string): Promise<void> {
    const req = new RevertVoteEndResultFinalizationRequest();
    req.setVoteId(voteId);
    return this.requestEmptyResp(c => c.revertEndResultFinalization, req);
  }

  public getBallotResult(ballotResultId: string): Promise<BallotResult> {
    const req = new GetBallotResultRequest();
    req.setBallotResultId(ballotResultId);
    return this.request(
      c => c.getBallotResult,
      req,
      r => VoteResultService.mapToBallotResult(r),
    );
  }

  public validateEnterCountOfVoters(voteResult: VoteResult): Promise<ValidationSummary> {
    const req = new ValidateEnterVoteResultCountOfVotersRequest();
    req.setRequest(this.mapToEnterCountOfVotersRequest(voteResult));
    return this.request(
      c => c.validateEnterCountOfVoters,
      req,
      r => this.validationMapping.mapToValidationSummary(r),
    );
  }

  public validateEnterResults(result: VoteResult): Promise<ValidationSummary> {
    const req = new ValidateEnterVoteResultsRequest();
    req.setRequest(this.mapToEnterResultsRequest(result));
    return this.request(
      c => c.validateEnterResults,
      req,
      r => this.validationMapping.mapToValidationSummary(r),
    );
  }

  public validateEnterCorrectionResults(result: VoteResult): Promise<ValidationSummary> {
    const req = new ValidateEnterVoteResultCorrectionRequest();
    req.setRequest(this.mapToEnterCorrectionResultsRequest(result));
    return this.request(
      c => c.validateEnterCorrectionResults,
      req,
      r => this.validationMapping.mapToValidationSummary(r),
    );
  }

  public async resetToSubmissionFinishedAndFlagForCorrection(voteResultId: string): Promise<void> {
    const req = new VoteResultResetToSubmissionFinishedAndFlagForCorrectionRequest();
    req.setVoteResultId(voteResultId);
    await this.requestEmptyResp(c => c.resetToSubmissionFinishedAndFlagForCorrection, req);
  }

  private mapToResultRequestList(results: BallotResult[]): EnterVoteBallotResultsRequest[] {
    return results.map(r => {
      const ballotResult = new EnterVoteBallotResultsRequest();
      ballotResult.setCountOfVoters(this.mapToCountOfVotersProto(r.countOfVoters));
      ballotResult.setBallotId(r.ballot.id);

      for (const result of r.questionResults) {
        const newQuestionResult = new EnterVoteBallotQuestionResultRequest();
        newQuestionResult.setQuestionNumber(result.question.number);
        newQuestionResult.setReceivedCountYes(createInt32Value(result.conventionalSubTotal.totalCountOfAnswer1));
        newQuestionResult.setReceivedCountNo(createInt32Value(result.conventionalSubTotal.totalCountOfAnswer2));
        newQuestionResult.setReceivedCountUnspecified(createInt32Value(result.conventionalSubTotal.totalCountOfAnswerUnspecified));
        ballotResult.addQuestionResults(newQuestionResult);
      }

      for (const result of r.tieBreakQuestionResults) {
        const newQuestionResult = new EnterVoteTieBreakQuestionResultRequest();
        newQuestionResult.setQuestionNumber(result.question.number);
        newQuestionResult.setReceivedCountQ1(createInt32Value(result.conventionalSubTotal.totalCountOfAnswer1));
        newQuestionResult.setReceivedCountQ2(createInt32Value(result.conventionalSubTotal.totalCountOfAnswer2));
        newQuestionResult.setReceivedCountUnspecified(createInt32Value(result.conventionalSubTotal.totalCountOfAnswerUnspecified));
        ballotResult.addTieBreakQuestionResults(newQuestionResult);
      }

      return ballotResult;
    });
  }

  private mapToResultsCountOfVotersRequestList(results: BallotResult[]): EnterVoteBallotResultsCountOfVotersRequest[] {
    return results.map(r => {
      const ballotResult = new EnterVoteBallotResultsCountOfVotersRequest();
      ballotResult.setCountOfVoters(this.mapToCountOfVotersProto(r.countOfVoters));
      ballotResult.setBallotId(r.ballot.id);
      return ballotResult;
    });
  }

  private mapToVoteEndResult(data: VoteEndResultProto): VoteEndResult {
    return {
      contest: ContestService.mapToContest(data.getContest()!),
      vote: VoteResultService.mapToVote(data.getVote()!),
      countOfVotersInformation: ContestCountingCircleDetailsService.mapToCountOfVotersInformation(data.getCountOfVotersInformation()!),
      votingCards: data.getVotingCardsList().map(v => ContestCountingCircleDetailsService.mapToVotingCard(v)),
      ballotEndResults: this.mapToBallotEndResults(data.getBallotEndResultsList()),
      countOfDoneCountingCircles: data.getCountOfDoneCountingCircles(),
      totalCountOfCountingCircles: data.getTotalCountOfCountingCircles(),
      allCountingCirclesDone: data.getAllCountingCirclesDone(),
      finalized: data.getFinalized(),
    };
  }

  private mapToBallotEndResults(data: BallotEndResultProto[]): BallotEndResult[] {
    return data.map(ballotResult => ({
      ballot: ballotResult.getBallot()!.toObject(),
      countOfVoters: mapToCountOfVoters(ballotResult.getCountOfVoters()!.toObject()),
      questionEndResults: this.mapToBallotQuestionEndResults(ballotResult.getQuestionEndResultsList()),
      tieBreakQuestionEndResults: this.mapToTieBreakQuestionEndResults(ballotResult.getTieBreakQuestionEndResultsList()),
    }));
  }

  private mapToBallotQuestionEndResults(data: BallotQuestionEndResultProto[]): BallotQuestionEndResult[] {
    return data.map(ballotQuestionResult => ({
      totalCountOfAnswer1: ballotQuestionResult.getTotalCountOfAnswerYes(),
      totalCountOfAnswer2: ballotQuestionResult.getTotalCountOfAnswerNo(),
      totalCountOfAnswerUnspecified: ballotQuestionResult.getTotalCountOfAnswerUnspecified(),
      question: ballotQuestionResult.getQuestion()!.toObject(),
      conventionalSubTotal: VoteResultService.mapToBallotQuestionResultSubTotal(ballotQuestionResult.getConventionalSubTotal()!),
      eVotingSubTotal: VoteResultService.mapToBallotQuestionResultSubTotal(ballotQuestionResult.getEVotingSubTotal()!),
      eCountingSubTotal: VoteResultService.mapToBallotQuestionResultSubTotal(ballotQuestionResult.getECountingSubTotal()!),
      countOfCountingCircle1: ballotQuestionResult.getCountOfCountingCircleYes(),
      countOfCountingCircle2: ballotQuestionResult.getCountOfCountingCircleNo(),
      hasCountingCircleMajority: ballotQuestionResult.getHasCountingCircleMajority(),
      hasCountingCircleUnanimity: ballotQuestionResult.getHasCountingCircleUnanimity(),
      accepted: ballotQuestionResult.getAccepted(),
    }));
  }

  private mapToTieBreakQuestionEndResults(data: TieBreakQuestionEndResultProto[]): TieBreakQuestionEndResult[] {
    return data.map(tieBreakQuestionResult => ({
      totalCountOfAnswer1: tieBreakQuestionResult.getTotalCountOfAnswerQ1(),
      totalCountOfAnswer2: tieBreakQuestionResult.getTotalCountOfAnswerQ2(),
      totalCountOfAnswerUnspecified: tieBreakQuestionResult.getTotalCountOfAnswerUnspecified(),
      question: tieBreakQuestionResult.getQuestion()!.toObject(),
      conventionalSubTotal: VoteResultService.mapToTieBreakQuestionResultSubTotal(tieBreakQuestionResult.getConventionalSubTotal()!),
      eVotingSubTotal: VoteResultService.mapToTieBreakQuestionResultSubTotal(tieBreakQuestionResult.getEVotingSubTotal()!),
      eCountingSubTotal: VoteResultService.mapToTieBreakQuestionResultSubTotal(tieBreakQuestionResult.getECountingSubTotal()!),
      countOfCountingCircle1: tieBreakQuestionResult.getCountOfCountingCircleQ1(),
      countOfCountingCircle2: tieBreakQuestionResult.getCountOfCountingCircleQ2(),
      hasCountingCircleQ1Majority: tieBreakQuestionResult.getHasCountingCircleQ1Majority(),
      hasCountingCircleQ2Majority: tieBreakQuestionResult.getHasCountingCircleQ2Majority(),
      questionNumberWithMajority: this.getQuestionNumberWithMajority(tieBreakQuestionResult),
      q1Accepted: tieBreakQuestionResult.getQ1Accepted(),
    }));
  }

  private getQuestionNumberWithMajority(tieBreakQuestionResult: TieBreakQuestionEndResultProto): number | undefined {
    if (tieBreakQuestionResult.getHasCountingCircleQ1Majority()) {
      return tieBreakQuestionResult.getQuestion()!.toObject().question1Number;
    }

    if (tieBreakQuestionResult.getHasCountingCircleQ2Majority()) {
      return tieBreakQuestionResult.getQuestion()!.toObject().question2Number;
    }

    return undefined;
  }

  private mapToEnterResultsRequest(voteResult: VoteResult): EnterVoteResultsRequest {
    const req = new EnterVoteResultsRequest();
    req.setVoteResultId(voteResult.id);
    req.setResultsList(this.mapToResultRequestList(voteResult.results));
    return req;
  }

  private mapToEnterCorrectionResultsRequest(voteResult: VoteResult): EnterVoteResultCorrectionRequest {
    const req = new EnterVoteResultCorrectionRequest();
    req.setVoteResultId(voteResult.id);
    req.setResultsList(this.mapToResultRequestList(voteResult.results));
    return req;
  }

  private mapToEnterCountOfVotersRequest(voteResult: VoteResult): EnterVoteResultCountOfVotersRequest {
    const req = new EnterVoteResultCountOfVotersRequest();
    req.setVoteResultId(voteResult.id);
    req.setResultsCountOfVotersList(this.mapToResultsCountOfVotersRequestList(voteResult.results));
    return req;
  }
}
