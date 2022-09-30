/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import {
  GetResultCommentsRequest,
  GetResultListRequest,
  GetResultOverviewRequest,
  GetResultStateChangesRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/result_requests_pb';
import { ResultServiceClient, ResultServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/result_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcStreamingService, retryForeverWithBackoff } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Comment,
  CommentProto,
  ContestCountingCircleDetails,
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
} from '../models';
import { ContestCountingCircleDetailsService } from './contest-counting-circle-details.service';
import { ContestService } from './contest.service';
import { PoliticalBusinessService } from './political-business.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class ResultService extends GrpcStreamingService<ResultServicePromiseClient, ResultServiceClient> {
  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
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

  public getStateChanges(contestId: string): Observable<ResultStateChangeProto.AsObject> {
    const req = new GetResultStateChangesRequest();
    req.setContestId(contestId);
    return this.requestServerStream(
      c => c.getStateChanges,
      req,
      r => r.toObject(),
    ).pipe(retryForeverWithBackoff());
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
    };
  }

  private mapToResultListResult(data: ResultListResultProto): ResultListResult {
    return {
      id: data.getId(),
      hasComments: data.getHasComments(),
      state: data.getState(),
      submissionDoneTimestamp: data.getSubmissionDoneTimestamp()?.toDate(),
      politicalBusiness: PoliticalBusinessService.mapToPoliticalBusiness(data.getPoliticalBusiness()!),
    };
  }

  private mapToResultOverview(data: ResultOverviewProto): ResultOverview {
    return {
      contest: ContestService.mapToContest(data.getContest()!),
      politicalBusinesses: data.getPoliticalBusinessesList().map(x => PoliticalBusinessService.mapToPoliticalBusiness(x)),
      countingCircleResults: data.getCountingCircleResultsList().map(x => this.mapToResultOverviewCountingCircleResults(x)),
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
