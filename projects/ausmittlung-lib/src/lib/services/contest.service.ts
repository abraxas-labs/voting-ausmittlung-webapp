/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContestServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/contest_service_grpc_web_pb';
import { ContestState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contest_pb';
import {
  GetAccessibleCountingCirclesRequest,
  GetCantonDefaultsRequest,
  GetContestRequest,
  ListContestSummariesRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/contest_requests_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { ContestCantonDefaults, CountingCircle, DomainOfInfluence, DomainOfInfluenceProto } from '../models';
import { Contest, ContestCantonDefaultsProto, ContestProto, ContestSummary, ContestSummaryProto } from '../models/contest.model';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { groupBySingle } from './utils/array.utils';

@Injectable({
  providedIn: 'root',
})
export class ContestService extends GrpcService<ContestServicePromiseClient> {
  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
    super(ContestServicePromiseClient, env, grpcBackend);
  }

  public static mapToContest(data: ContestProto): Contest {
    const state = data.getState();
    return {
      ...data.toObject(),
      date: data.getDate()?.toDate(),
      endOfTestingPhase: data.getEndOfTestingPhase()?.toDate(),
      testingPhaseEnded: data.getTestingPhaseEnded(),
      eVotingFrom: data.getEVotingFrom()?.toDate(),
      eVotingTo: data.getEVotingTo()?.toDate(),
      locked: state === ContestState.CONTEST_STATE_PAST_LOCKED || state === ContestState.CONTEST_STATE_ARCHIVED,
      cantonDefaults: ContestService.mapToCantonDefaults(data.getCantonDefaults()!),
    };
  }

  public get(id: string): Promise<Contest> {
    const req = new GetContestRequest();
    req.setId(id);
    return this.request(
      c => c.get,
      req,
      r => ContestService.mapToContest(r),
    );
  }

  public getAccessibleCountingCircles(contestId: string): Promise<CountingCircle[]> {
    const req = new GetAccessibleCountingCirclesRequest();
    req.setContestId(contestId);

    return this.request(
      c => c.getAccessibleCountingCircles,
      req,
      r => r.toObject().countingCirclesList,
    );
  }

  public listSummaries(...states: ContestState[]): Promise<ContestSummary[]> {
    const req = new ListContestSummariesRequest();
    req.setStatesList(states);

    return this.request(
      c => c.listSummaries,
      req,
      r => this.mapToContestSummaries(r.getContestSummariesList()),
    );
  }

  public getCantonDefaults(request: GetCantonDefaultsRequest): Promise<ContestCantonDefaults> {
    return this.request(
      c => c.getCantonDefaults,
      request,
      r => ContestService.mapToCantonDefaults(r),
    );
  }

  private static mapToCantonDefaults(data: ContestCantonDefaultsProto): ContestCantonDefaults {
    const descriptions = data.getCountingCircleResultStateDescriptionsList().map(x => x.toObject());
    return {
      ...data.toObject(),
      countingCircleResultStateDescriptionsByState: groupBySingle(
        descriptions,
        x => x.state,
        x => x.description,
      ),
    };
  }

  private mapToContestSummaries(data: ContestSummaryProto[]): ContestSummary[] {
    return data.map(cs => this.mapToContestSummary(cs));
  }

  private mapToContestSummary(data: ContestSummaryProto): ContestSummary {
    const state = data.getState();
    return {
      id: data.getId(),
      date: data.getDate()?.toDate(),
      domainOfInfluenceId: data.getDomainOfInfluenceId(),
      description: data.getDescription(),
      endOfTestingPhase: data.getEndOfTestingPhase()?.toDate(),
      testingPhaseEnded: data.getTestingPhaseEnded(),
      contestEntriesDetails: data.getContestEntriesDetailsList().map(d => d.toObject()),
      eVoting: data.getEVoting(),
      eVotingResultsImported: data.getEVotingResultsImported(),
      eVotingFrom: data.getEVotingFrom()?.toDate(),
      eVotingTo: data.getEVotingTo()?.toDate(),
      state,
      locked: state === ContestState.CONTEST_STATE_PAST_LOCKED || state === ContestState.CONTEST_STATE_ARCHIVED,
      cantonDefaults: ContestService.mapToCantonDefaults(data.getCantonDefaults()!),
      domainOfInfluence: this.mapToDomainOfInfluence(data.getDomainOfInfluence()!),
      eCountingResultsImported: data.getECountingResultsImported(),
    };
  }

  private mapToDomainOfInfluence(doi: DomainOfInfluenceProto): DomainOfInfluence {
    const doiId = doi.getId();
    return {
      id: doiId,
      name: doi.getName(),
      shortName: doi.getShortName(),
      authorityName: doi.getAuthorityName(),
      secureConnectId: doi.getSecureConnectId(),
      type: doi.getType(),
      parentId: doi.getParentId(),
      childrenList: this.mapToDomainOfInfluences(doi.getChildrenList()),
      canton: doi.getCanton(),
      contactPerson: doi.getContactPerson()?.toObject(),
    };
  }

  private mapToDomainOfInfluences(data: DomainOfInfluenceProto[] | undefined): DomainOfInfluence[] {
    if (!data) {
      return [];
    }

    return data.map(doi => this.mapToDomainOfInfluence(doi));
  }
}
