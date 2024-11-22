/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { MajorityElectionResultBundleServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/majority_election_result_bundle_service_grpc_web_pb';
import {
  CreateMajorityElectionResultBallotRequest,
  CreateMajorityElectionResultBundleRequest,
  CreateUpdateSecondaryMajorityElectionResultBallotRequest,
  DeleteMajorityElectionResultBallotRequest,
  DeleteMajorityElectionResultBundleRequest,
  GetMajorityElectionResultBallotRequest,
  GetMajorityElectionResultBundleChangesRequest,
  GetMajorityElectionResultBundleRequest,
  GetMajorityElectionResultBundlesRequest,
  MajorityElectionResultBundleCorrectionFinishedRequest,
  MajorityElectionResultBundleSubmissionFinishedRequest,
  RejectMajorityElectionBundleReviewRequest,
  SucceedMajorityElectionBundleReviewRequest,
  UpdateMajorityElectionResultBallotRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/majority_election_result_bundle_requests_pb';
import {
  CreateMajorityElectionResultBundleResponse,
  GetMajorityElectionResultBundleResponse,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/responses/majority_election_result_bundle_responses_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService, retryForeverWithBackoff } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Int32Value } from 'google-protobuf/google/protobuf/wrappers_pb';
import { Observable } from 'rxjs';
import {
  MajorityElectionBase,
  MajorityElectionResultBallot,
  MajorityElectionResultBallotBase,
  MajorityElectionResultBundleDetails,
  MajorityElectionResultBundleProto,
  MajorityElectionResultBundles,
  MajorityElectionResultBundlesProto,
  PoliticalBusinessResultBundle,
  ProtocolExport,
  ProtocolExportProto,
} from '../models';
import { MajorityElectionResultBallotProto } from '../models/majority-election-result.model';
import { MajorityElectionResultService } from './majority-election-result.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class MajorityElectionResultBundleService extends GrpcService<MajorityElectionResultBundleServicePromiseClient> {
  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
    super(MajorityElectionResultBundleServicePromiseClient, env, grpcBackend);
  }

  public hasValidEmptyVoteCount(ballot: MajorityElectionResultBallot): boolean {
    return (
      ballot.computedEmptyVoteCount === ballot.emptyVoteCount &&
      ballot.emptyVoteCount >= 0 &&
      ballot.secondaryMajorityElectionBallots.every(x => x.computedEmptyVoteCount === x.emptyVoteCount && x.emptyVoteCount >= 0)
    );
  }

  public getBundles(electionResultId: string): Promise<MajorityElectionResultBundles> {
    const req = new GetMajorityElectionResultBundlesRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.getBundles,
      req,
      r => this.mapToBundles(r),
    );
  }

  public getBundleChanges(electionResultId: string, onRetry: () => {}): Observable<PoliticalBusinessResultBundle> {
    const req = new GetMajorityElectionResultBundleChangesRequest();
    req.setElectionResultId(electionResultId);
    return this.requestServerStream(
      c => c.getBundleChanges,
      req,
      r => this.mapToBundle(r),
    ).pipe(retryForeverWithBackoff(onRetry));
  }

  public getBundle(bundleId: string): Promise<MajorityElectionResultBundleDetails> {
    const req = new GetMajorityElectionResultBundleRequest();
    req.setBundleId(bundleId);
    return this.request(
      c => c.getBundle,
      req,
      r => this.mapToBundleDetails(r),
    );
  }

  public getBallot(
    bundleId: string,
    ballotNumber: number,
    electionByIds: { primaryElection: MajorityElectionBase; [id: string]: MajorityElectionBase },
  ): Promise<MajorityElectionResultBallot> {
    const req = new GetMajorityElectionResultBallotRequest();
    req.setBallotNumber(ballotNumber);
    req.setBundleId(bundleId);
    return this.request(
      c => c.getBallot,
      req,
      r => this.mapToBallot(r, electionByIds),
    );
  }

  public createBundle(electionResultId: string, bundleNumber?: number): Promise<CreateMajorityElectionResultBundleResponse.AsObject> {
    const req = new CreateMajorityElectionResultBundleRequest();
    req.setElectionResultId(electionResultId);
    if (!!bundleNumber) {
      const bundleNumberValue = new Int32Value();
      bundleNumberValue.setValue(bundleNumber);
      req.setBundleNumber(bundleNumberValue);
    }
    return this.request(
      c => c.createBundle,
      req,
      resp => resp.toObject(),
    );
  }

  public deleteBundle(bundleId: string): Promise<void> {
    const req = new DeleteMajorityElectionResultBundleRequest();
    req.setBundleId(bundleId);
    return this.requestEmptyResp(c => c.deleteBundle, req);
  }

  public async createBallot(bundleId: string, ballot: MajorityElectionResultBallot, autoEmptyVoteCount: boolean): Promise<number> {
    const req = new CreateMajorityElectionResultBallotRequest();
    this.mapToBallotsRequest(req, bundleId, ballot, autoEmptyVoteCount);
    return await this.request(
      c => c.createBallot,
      req,
      r => r.getBallotNumber(),
    );
  }

  public async updateBallot(bundleId: string, ballot: MajorityElectionResultBallot, autoEmptyVoteCount: boolean): Promise<void> {
    const req = new UpdateMajorityElectionResultBallotRequest();
    req.setBallotNumber(ballot.number);
    this.mapToBallotsRequest(req, bundleId, ballot, autoEmptyVoteCount);
    await this.request(
      c => c.updateBallot,
      req,
      r => r,
    );
  }

  public async deleteBallot(bundleId: string, ballotNumber: number): Promise<void> {
    const req = new DeleteMajorityElectionResultBallotRequest();
    req.setBundleId(bundleId);
    req.setBallotNumber(ballotNumber);
    await this.requestEmptyResp(c => c.deleteBallot, req);
  }

  public async bundleSubmissionFinished(bundleId: string): Promise<void> {
    const req = new MajorityElectionResultBundleSubmissionFinishedRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.bundleSubmissionFinished, req);
  }

  public async bundleCorrectionFinished(bundleId: string): Promise<void> {
    const req = new MajorityElectionResultBundleCorrectionFinishedRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.bundleCorrectionFinished, req);
  }

  public async succeedBundleReview(bundleIds: string[]): Promise<void> {
    const req = new SucceedMajorityElectionBundleReviewRequest();
    req.setBundleIdsList(bundleIds);
    await this.requestEmptyResp(c => c.succeedBundleReview, req);
  }

  public async rejectBundleReview(bundleId: string): Promise<void> {
    const req = new RejectMajorityElectionBundleReviewRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.rejectBundleReview, req);
  }

  private mapToBundles(proto: MajorityElectionResultBundlesProto): MajorityElectionResultBundles {
    return {
      politicalBusinessResult: MajorityElectionResultService.mapToMajorityElectionResult(proto.getElectionResult()!),
      bundles: proto.getBundlesList().map(x => this.mapToBundle(x)),
    };
  }

  private mapToBundleDetails(proto: GetMajorityElectionResultBundleResponse): MajorityElectionResultBundleDetails {
    return {
      electionResult: MajorityElectionResultService.mapToMajorityElectionResult(proto.getElectionResult()!),
      bundle: this.mapToBundle(proto.getBundle()!),
    };
  }

  private mapToBundle(proto: MajorityElectionResultBundleProto): PoliticalBusinessResultBundle {
    const obj = proto.toObject();
    return {
      ...obj,
      createdBy: obj.createdBy!,
      ballotNumbersToReview: obj.ballotNumbersToReviewList,
      protocolExport: this.mapToProtocolExport(proto.getProtocolExport()),
    };
  }

  private mapToBallotsRequest(
    request: CreateMajorityElectionResultBallotRequest | UpdateMajorityElectionResultBallotRequest,
    bundleId: string,
    ballot: MajorityElectionResultBallot,
    autoEmptyVoteCounting: boolean,
  ): void {
    request.setBundleId(bundleId);
    this.mapToBallotRequest(request, ballot, autoEmptyVoteCounting);

    request.setSecondaryMajorityElectionResultsList(
      ballot.secondaryMajorityElectionBallots.map(sme => {
        const req = new CreateUpdateSecondaryMajorityElectionResultBallotRequest();
        req.setSecondaryMajorityElectionId(sme.election.id);
        this.mapToBallotRequest(req, sme, autoEmptyVoteCounting);
        return req;
      }),
    );
  }

  private mapToBallotRequest(
    request:
      | CreateMajorityElectionResultBallotRequest
      | UpdateMajorityElectionResultBallotRequest
      | CreateUpdateSecondaryMajorityElectionResultBallotRequest,
    ballot: MajorityElectionResultBallotBase,
    autoEmptyVoteCounting: boolean,
  ): void {
    request.setSelectedCandidateIdsList(ballot.candidates.filter(c => c.selected).map(c => c.id));
    request.setIndividualVoteCount(ballot.individualVoteCount);
    request.setInvalidVoteCount(ballot.invalidVoteCount);
    if (!autoEmptyVoteCounting && ballot.election.numberOfMandates > 1) {
      const smeEmptyVoteCount = new Int32Value();
      smeEmptyVoteCount.setValue(ballot.emptyVoteCount);
      request.setEmptyVoteCount(smeEmptyVoteCount);
    }
  }

  private mapToBallot(
    response: MajorityElectionResultBallotProto,
    electionByIds: { primaryElection: MajorityElectionBase; [id: string]: MajorityElectionBase },
  ): MajorityElectionResultBallot {
    const obj = response.toObject();
    return {
      ...obj,
      isNew: false,
      election: electionByIds.primaryElection,
      computedEmptyVoteCount: obj.emptyVoteCount,
      candidates: obj.candidatesList,
      secondaryMajorityElectionBallots: obj.secondaryMajorityElectionBallotsList.map(seb => ({
        ...seb,
        computedEmptyVoteCount: seb.emptyVoteCount,
        election: electionByIds[seb.electionId],
        candidates: seb.candidatesList,
      })),
    };
  }

  private mapToProtocolExport(response?: ProtocolExportProto): ProtocolExport | undefined {
    if (!response) {
      return undefined;
    }

    return {
      ...response.toObject(),
      started: response.getStarted()!.toDate(),
    };
  }
}
