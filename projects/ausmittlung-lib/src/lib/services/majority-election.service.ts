/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { MajorityElectionServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/majority_election_service_grpc_web_pb';
import {
  ListMajorityElectionCandidatesRequest,
  ListSecondaryMajorityElectionCandidatesRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/majority_election_requests_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import {
  MajorityElection,
  MajorityElectionCandidate,
  MajorityElectionCandidates,
  MajorityElectionCandidatesProto,
  MajorityElectionProto,
} from '../models';
import { ContestService } from './contest.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class MajorityElectionService extends GrpcService<MajorityElectionServicePromiseClient> {
  // cache candidates by electionId
  // only the most recent call is cached.
  private candidatesCache: { [id: string]: MajorityElectionCandidates } = {};
  private secondaryCandidatesCache: { [id: string]: MajorityElectionCandidate[] } = {};

  constructor() {
    const grpcBackend = inject(GrpcBackendService);
    const env = inject<GrpcEnvironment>(GRPC_ENV_INJECTION_TOKEN);

    super(MajorityElectionServicePromiseClient, env, grpcBackend);
  }

  public static mapToElection(proto: MajorityElectionProto): MajorityElection {
    const contest = proto.getContest();
    return {
      ...proto.toObject(),
      contest: !contest ? undefined : ContestService.mapToContest(contest),
    };
  }

  public async listCandidatesInclSecondary(electionId: string): Promise<MajorityElectionCandidates> {
    const cacheKey = electionId + '-inclSecondary';
    if (this.candidatesCache.hasOwnProperty(cacheKey)) {
      return Promise.resolve(this.candidatesCache[cacheKey]);
    }

    const req = new ListMajorityElectionCandidatesRequest();
    req.setElectionId(electionId);
    req.setIncludeCandidatesOfSecondaryElection(true);
    return this.listCandidatesForRequest(cacheKey, req);
  }

  public async listCandidates(electionId: string): Promise<MajorityElectionCandidate[]> {
    if (this.candidatesCache.hasOwnProperty(electionId)) {
      return Promise.resolve(this.candidatesCache[electionId].candidates);
    }

    const req = new ListMajorityElectionCandidatesRequest();
    req.setElectionId(electionId);
    return this.listCandidatesForRequest(electionId, req).then(x => x.candidates);
  }

  public async listCandidatesOfSecondaryElection(electionId: string): Promise<MajorityElectionCandidate[]> {
    if (this.secondaryCandidatesCache.hasOwnProperty(electionId)) {
      return Promise.resolve(this.secondaryCandidatesCache[electionId]);
    }

    // only keep the most recent election's candidates in memory
    this.secondaryCandidatesCache = {};
    const req = new ListSecondaryMajorityElectionCandidatesRequest();
    req.setSecondaryElectionId(electionId);
    const response = await this.request(
      c => c.listSecondaryElectionCandidates,
      req,
      resp => resp.toObject().candidatesList,
    );
    this.secondaryCandidatesCache[electionId] = response;
    return response;
  }

  private async listCandidatesForRequest(cacheId: string, req: ListMajorityElectionCandidatesRequest): Promise<MajorityElectionCandidates> {
    // only keep the most recent election's candidates in memory
    this.candidatesCache = {};

    const response = await this.request(
      c => c.listCandidates,
      req,
      resp => resp.toObject(),
    );

    const candidates = this.mapToElectionCandidates(response);
    this.candidatesCache[cacheId] = candidates;
    return candidates;
  }

  private mapToElectionCandidates(response: MajorityElectionCandidatesProto.AsObject): MajorityElectionCandidates {
    return {
      candidates: response.candidatesList,
      secondaryElectionCandidates: response.secondaryElectionCandidatesList.map(x => ({
        candidates: x.candidatesList,
        secondaryMajorityElectionId: x.secondaryMajorityElectionId,
      })),
    };
  }
}
