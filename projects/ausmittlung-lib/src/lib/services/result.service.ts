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
  GetResultStateChangesRequest,
  ResetCountingCircleResultsRequest,
  ValidateCountingCircleResultsRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/result_requests_pb';
import { ResultServiceClient, ResultServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/result_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcStreamingService, retryForeverWithBackoff } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Comment,
  CommentProto,
  ContestCountingCircleDetails,
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
  ResultOverviewProto,
  ResultStateChangeProto,
  ValidationSummaries,
  PoliticalBusinessUnionProto,
  PoliticalBusinessUnion,
} from '../models';
import { ContestCountingCircleDetailsService } from './contest-counting-circle-details.service';
import { ContestService } from './contest.service';
import { PoliticalBusinessService } from './political-business.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { ValidationMappingService } from './validation-mapping.service';
import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import { PoliticalBusinessUnionService } from './political-business-union.service';

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

  public getStateChanges(contestId: string, onRetry: () => {}): Observable<ResultStateChangeProto.AsObject> {
    const req = new GetResultStateChangesRequest();
    req.setContestId(contestId);
    return this.requestServerStream(
      c => c.getStateChanges,
      req,
      r => r.toObject(),
    ).pipe(retryForeverWithBackoff(onRetry));
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
      details: this.mapToContestCountingCircleDetails(data),
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
      countingCircle: data.getCountingCircle()!.toObject(),
      results: data.getResultsList().map(x => this.mapToResultOverviewCountingCircleResult(x)),
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
    };
  }

  private mapToContestCountingCircleDetails(resultList: ResultListProto): ContestCountingCircleDetails {
    const data = resultList.getDetails();
    if (!data) {
      return {
        countOfVotersInformation: {
          subTotalInfoList: [],
          totalCountOfVoters: 0,
        },
        votingCards: [],
        countingCircleId: resultList.getCountingCircle()!.getId(),
        contestId: resultList.getContest()!.getId(),
        eVoting: false,
        countingMachine: CountingMachine.COUNTING_MACHINE_UNSPECIFIED,
      };
    }

    return {
      ...data.toObject(),
      countOfVotersInformation: ContestCountingCircleDetailsService.mapToCountOfVotersInformation(data.getCountOfVotersInformation()!),
      votingCards: data.getVotingCardsList().map(v => ContestCountingCircleDetailsService.mapToVotingCard(v)),
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
