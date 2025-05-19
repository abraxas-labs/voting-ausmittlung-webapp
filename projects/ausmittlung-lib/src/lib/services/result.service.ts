/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  CountingCircleResultsPrepareSubmissionFinishedRequest,
  CountingCircleResultsSubmissionFinishedRequest,
  GetResultCommentsRequest,
  GetResultListRequest,
  GetResultOverviewRequest,
  ResetCountingCircleResultsRequest,
  ValidateCountingCircleResultsRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/result_requests_pb';
import { ResultServiceClient, ResultServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/result_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcStreamingService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Comment,
  CommentProto,
  ContestCountingCircleDetails,
  ContestCountingCircleDetailsProto,
  CountingMachine,
  ResultList,
  ResultListProto,
  ResultListResult,
  ResultListResultProto,
  ResultOverview,
  ResultOverviewCountingCircleResult,
  ResultOverviewCountingCircleResultProto,
  ResultOverviewCountingCircleResults,
  ResultOverviewCountingCircleResultsProto,
  ResultOverviewCountingCircleWithDetails,
  ResultOverviewCountingCircleWithDetailsProto,
  ResultOverviewProto,
  ValidationSummaries,
} from '../models';
import { ContestCountingCircleDetailsService } from './contest-counting-circle-details.service';
import { ContestService } from './contest.service';
import { PoliticalBusinessService } from './political-business.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { ValidationMappingService } from './validation-mapping.service';
import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import { PoliticalBusinessUnionService } from './political-business-union.service';
import * as models_vote_result_pb from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_result_pb';
import { BallotQuestionResult } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_result_pb';
import { BallotSubType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';

@Injectable({
  providedIn: 'root',
})
export class ResultService extends GrpcStreamingService<ResultServicePromiseClient, ResultServiceClient> {
  constructor(
    grpcBackend: GrpcBackendService,
    @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment,
    private readonly validationMapping: ValidationMappingService,
  ) {
    super(ResultServicePromiseClient, ResultServiceClient, env, grpcBackend);
  }

  public getOverview(contestId: string): Promise<ResultOverview> {
    const req = new GetResultOverviewRequest();
    req.setContestId(contestId);
    return this.request(
      c => c.getOverview,
      req,
      r => this.mapToResultOverview(r),
    );
  }

  public getList(contestId: string, countingCircleId: string): Promise<ResultList> {
    const req = new GetResultListRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    return this.request(
      c => c.getList,
      req,
      r => this.mapToResultList(r),
    );
  }

  public getComments(resultId: string): Promise<Comment[]> {
    const req = new GetResultCommentsRequest();
    req.setResultId(resultId);
    return this.request(
      c => c.getResultComments,
      req,
      r => r.getCommentsList().map(c => this.mapToComment(c)),
    );
  }

  public resetCountingCircleResults(contestId: string, countingCircleId: string): Promise<void> {
    const req = new ResetCountingCircleResultsRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    return this.requestEmptyResp(c => c.resetCountingCircleResults, req);
  }

  public validateCountingCircleResults(contestId: string, countingCircleId: string, resultIds: string[]): Promise<ValidationSummaries> {
    const req = new ValidateCountingCircleResultsRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    req.setCountingCircleResultIdsList(resultIds);
    return this.request(
      c => c.validateCountingCircleResults,
      req,
      r => this.validationMapping.mapToValidationSummaries(r),
    );
  }

  public prepareSubmissionFinished(contestId: string, countingCircleId: string, resultIds: string[]): Promise<SecondFactorTransaction> {
    const req = new CountingCircleResultsPrepareSubmissionFinishedRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    req.setCountingCircleResultIdsList(resultIds);
    return this.request(
      c => c.prepareSubmissionFinished,
      req,
      r => r,
    );
  }

  public submissionFinished(
    contestId: string,
    countingCircleId: string,
    resultIds: string[],
    secondFactorTransactionId: string,
  ): Observable<void> {
    const req = new CountingCircleResultsSubmissionFinishedRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    req.setCountingCircleResultIdsList(resultIds);
    req.setSecondFactorTransactionId(secondFactorTransactionId);
    return this.requestClientStreamEmptyResp(c => c.submissionFinished, req);
  }

  private mapToResultList(data: ResultListProto): ResultList {
    const results = data.getResultsList().map(x => this.mapToResultListResult(x));
    return {
      ...data.toObject(),
      contest: ContestService.mapToContest(data.getContest()!),
      details: this.mapToContestCountingCircleDetails(data.getDetails(), data.getContest()!.getId(), data.getCountingCircle()!.getId()),
      countingCircle: data.getCountingCircle()!.toObject(),
      results,
      currentTenantIsResponsible: data.getCurrentTenantIsResponsible(),
      enabledVotingCardChannels: data.getEnabledVotingCardChannelsList().map(x => x.toObject()),
      enabledVoterTypes: data.getEnabledVoterTypesList(),
      electorateSummary: data.getElectorateSummary()!.toObject(),
    };
  }

  private mapToResultListResult(data: ResultListResultProto): ResultListResult {
    return {
      id: data.getId(),
      hasComments: data.getHasComments(),
      state: data.getState(),
      submissionDoneTimestamp: data.getSubmissionDoneTimestamp()?.toDate(),
      readyForCorrectionTimestamp: data.getReadyForCorrectionTimestamp()?.toDate(),
      auditedTentativelyTimestamp: data.getAuditedTentativelyTimestamp()?.toDate(),
      plausibilisedTimestamp: data.getPlausibilisedTimestamp()?.toDate(),
      politicalBusiness: PoliticalBusinessService.mapToPoliticalBusiness(data.getPoliticalBusiness()!),
    };
  }

  private mapToResultOverview(data: ResultOverviewProto): ResultOverview {
    return {
      contest: ContestService.mapToContest(data.getContest()!),
      politicalBusinesses: data.getPoliticalBusinessesList().map(x => PoliticalBusinessService.mapToPoliticalBusiness(x)),
      countingCircleResults: data.getCountingCircleResultsList().map(x => this.mapToResultOverviewCountingCircleResults(x)),
      currentTenantIsContestManager: data.getCurrentTenantIsContestManager(),
      politicalBusinessUnions: data.getPoliticalBusinessUnionsList().map(x => PoliticalBusinessUnionService.mapToPoliticalBusinessUnion(x)),
      hasPartialResults: data.getHasPartialResults(),
    };
  }

  private mapToResultOverviewCountingCircleResults(data: ResultOverviewCountingCircleResultsProto): ResultOverviewCountingCircleResults {
    return {
      countingCircleWithDetails: this.mapToResultOverCountingCircleWithDetails(data.getCountingCircle()!),
      results: data.getResultsList().map(x => this.mapToResultOverviewCountingCircleResult(x)),
    };
  }

  private mapToResultOverCountingCircleWithDetails(
    data: ResultOverviewCountingCircleWithDetailsProto,
  ): ResultOverviewCountingCircleWithDetails {
    return {
      countingCircle: data.getCountingCircle()!.toObject(),
      details: this.mapToContestCountingCircleDetails(data.getDetails()),
    };
  }

  private mapToResultOverviewCountingCircleResult(data: ResultOverviewCountingCircleResultProto): ResultOverviewCountingCircleResult {
    const obj = data.toObject();
    return {
      ...obj,
      submissionDoneTimestamp: data.getSubmissionDoneTimestamp()?.toDate(),
      readyForCorrectionTimestamp: data.getReadyForCorrectionTimestamp()?.toDate(),
      auditedTentativelyTimestamp: data.getAuditedTentativelyTimestamp()?.toDate(),
      plausibilisedTimestamp: data.getPlausibilisedTimestamp()?.toDate(),
      mainBallotTotalCountYes:
        obj.ballotResultsList.length > 0 ? obj.ballotResultsList[0].questionResultsList[0].totalCountOfAnswerYes : undefined,
      mainBallotTotalCountNo:
        obj.ballotResultsList.length > 0 ? obj.ballotResultsList[0].questionResultsList[0].totalCountOfAnswerNo : undefined,
      mainBallotTotalCountUnspecified:
        obj.ballotResultsList.length > 0 ? obj.ballotResultsList[0].questionResultsList[0].totalCountOfAnswerUnspecified : undefined,
      counterProposal1TotalCountYes: this.getCounterProposal1Result(obj.ballotResultsList)?.totalCountOfAnswerYes,
      counterProposal1TotalCountNo: this.getCounterProposal1Result(obj.ballotResultsList)?.totalCountOfAnswerNo,
      counterProposal1TotalCountUnspecified: this.getCounterProposal1Result(obj.ballotResultsList)?.totalCountOfAnswerUnspecified,
      counterProposal2TotalCountYes: this.getCounterProposal2Result(obj.ballotResultsList)?.totalCountOfAnswerYes,
      counterProposal2TotalCountNo: this.getCounterProposal2Result(obj.ballotResultsList)?.totalCountOfAnswerNo,
      counterProposal2TotalCountUnspecified: this.getCounterProposal2Result(obj.ballotResultsList)?.totalCountOfAnswerUnspecified,
      tieBreak1TotalCountYes: this.getTieBreakTotalCountYes(obj.ballotResultsList, 0, BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_1),
      tieBreak1TotalCountNo: this.getTieBreakTotalCountNo(obj.ballotResultsList, 0, BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_1),
      tieBreak1TotalCountUnspecified: this.getTieBreakTotalCountUnspecified(
        obj.ballotResultsList,
        0,
        BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_1,
      ),
      tieBreak2TotalCountYes: this.getTieBreakTotalCountYes(obj.ballotResultsList, 1, BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_2),
      tieBreak2TotalCountNo: this.getTieBreakTotalCountNo(obj.ballotResultsList, 1, BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_2),
      tieBreak2TotalCountUnspecified: this.getTieBreakTotalCountUnspecified(
        obj.ballotResultsList,
        1,
        BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_2,
      ),
      tieBreak3TotalCountYes: this.getTieBreakTotalCountYes(obj.ballotResultsList, 2, BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_3),
      tieBreak3TotalCountNo: this.getTieBreakTotalCountNo(obj.ballotResultsList, 2, BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_3),
      tieBreak3TotalCountUnspecified: this.getTieBreakTotalCountUnspecified(
        obj.ballotResultsList,
        2,
        BallotSubType.BALLOT_SUB_TYPE_TIE_BREAK_3,
      ),
    };
  }

  private getCounterProposal1Result(
    ballotResults: Array<models_vote_result_pb.BallotResult.AsObject>,
  ): BallotQuestionResult.AsObject | undefined {
    if (ballotResults.length === 0) {
      return undefined;
    }

    if (ballotResults.length === 1 && ballotResults[0].questionResultsList.length > 1) {
      return ballotResults[0].questionResultsList[1];
    }

    if (ballotResults.length > 1) {
      const counterProposal1Result = ballotResults.find(x => x.ballot?.ballotSubType === BallotSubType.BALLOT_SUB_TYPE_COUNTER_PROPOSAL_1);
      if (!counterProposal1Result) {
        return undefined;
      }

      return counterProposal1Result.questionResultsList[0];
    }

    return undefined;
  }

  private getCounterProposal2Result(
    ballotResults: Array<models_vote_result_pb.BallotResult.AsObject>,
  ): BallotQuestionResult.AsObject | undefined {
    if (ballotResults.length === 0) {
      return undefined;
    }

    if (ballotResults.length === 1 && ballotResults[0].questionResultsList.length > 2) {
      return ballotResults[0].questionResultsList[2];
    }

    if (ballotResults.length > 2) {
      const counterProposal2Result = ballotResults.find(x => x.ballot?.ballotSubType === BallotSubType.BALLOT_SUB_TYPE_COUNTER_PROPOSAL_2);
      if (!counterProposal2Result) {
        return undefined;
      }

      return counterProposal2Result.questionResultsList[0];
    }

    return undefined;
  }

  private getTieBreakTotalCountYes(
    ballotResults: Array<models_vote_result_pb.BallotResult.AsObject>,
    index: number,
    ballotSubType: BallotSubType,
  ): number | undefined {
    if (ballotResults.length === 0) {
      return undefined;
    }

    if (ballotResults.length === 1 && ballotResults[0].tieBreakQuestionResultsList.length > index) {
      return ballotResults[0].tieBreakQuestionResultsList[index].totalCountOfAnswerQ1;
    }

    if (ballotResults.length > 1) {
      const tieBreakResult = ballotResults.find(x => x.ballot?.ballotSubType === ballotSubType);
      if (!tieBreakResult) {
        return undefined;
      }

      return tieBreakResult.questionResultsList[0].totalCountOfAnswerYes;
    }

    return undefined;
  }

  private getTieBreakTotalCountNo(
    ballotResults: Array<models_vote_result_pb.BallotResult.AsObject>,
    index: number,
    ballotSubType: BallotSubType,
  ): number | undefined {
    if (ballotResults.length === 0) {
      return undefined;
    }

    if (ballotResults.length === 1 && ballotResults[0].tieBreakQuestionResultsList.length > index) {
      return ballotResults[0].tieBreakQuestionResultsList[index].totalCountOfAnswerQ2;
    }

    if (ballotResults.length > 1) {
      const tieBreakResult = ballotResults.find(x => x.ballot?.ballotSubType === ballotSubType);
      if (!tieBreakResult) {
        return undefined;
      }

      return tieBreakResult.questionResultsList[0].totalCountOfAnswerNo;
    }

    return undefined;
  }

  private getTieBreakTotalCountUnspecified(
    ballotResults: Array<models_vote_result_pb.BallotResult.AsObject>,
    index: number,
    ballotSubType: BallotSubType,
  ): number | undefined {
    if (ballotResults.length === 0) {
      return undefined;
    }

    if (ballotResults.length === 1 && ballotResults[0].tieBreakQuestionResultsList.length > index) {
      return ballotResults[0].tieBreakQuestionResultsList[index].totalCountOfAnswerUnspecified;
    }

    if (ballotResults.length > 1) {
      const tieBreakResult = ballotResults.find(x => x.ballot?.ballotSubType === ballotSubType);
      if (!tieBreakResult) {
        return undefined;
      }

      return tieBreakResult.questionResultsList[0].totalCountOfAnswerUnspecified;
    }

    return undefined;
  }

  private mapToContestCountingCircleDetails(
    details?: ContestCountingCircleDetailsProto,
    contestId?: string,
    countingCircleId?: string,
  ): ContestCountingCircleDetails {
    if (!details) {
      return {
        countOfVotersInformation: {
          subTotalInfoList: [],
          totalCountOfVoters: 0,
        },
        votingCards: [],
        countingCircleId: countingCircleId!,
        contestId: contestId!,
        eVoting: false,
        eCounting: false,
        eCountingResultsImported: false,
        countingMachine: CountingMachine.COUNTING_MACHINE_UNSPECIFIED,
      };
    }

    return {
      ...details.toObject(),
      countOfVotersInformation: ContestCountingCircleDetailsService.mapToCountOfVotersInformation(details.getCountOfVotersInformation()!),
      votingCards: details.getVotingCardsList().map(v => ContestCountingCircleDetailsService.mapToVotingCard(v)),
    };
  }

  private mapToComment(comment: CommentProto): Comment {
    return {
      ...comment.toObject(),
      createdAt: comment.getCreatedAt()!.toDate(),
      createdBy: comment.getCreatedBy()!.toObject(),
    };
  }
}
