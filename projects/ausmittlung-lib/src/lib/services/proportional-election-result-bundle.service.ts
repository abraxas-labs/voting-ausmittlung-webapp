/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ProportionalElectionResultBundleServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/proportional_election_result_bundle_service_grpc_web_pb';
import {
  CreateProportionalElectionResultBallotRequest,
  CreateProportionalElectionResultBundleRequest,
  CreateUpdateProportionalElectionResultBallotCandidateRequest,
  DeleteProportionalElectionResultBallotRequest,
  DeleteProportionalElectionResultBundleRequest,
  GetProportionalElectionResultBallotRequest,
  GetProportionalElectionResultBundleRequest,
  GetProportionalElectionResultBundlesRequest,
  ProportionalElectionResultBundleSubmissionFinishedRequest,
  RejectProportionalElectionBundleReviewRequest,
  SucceedProportionalElectionBundleReviewRequest,
  UpdateProportionalElectionResultBallotRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/proportional_election_result_bundle_requests_pb';
import {
  CreateProportionalElectionResultBundleResponse,
  GetProportionalElectionResultBundleResponse,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/responses/proportional_election_result_bundle_responses_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Int32Value } from 'google-protobuf/google/protobuf/wrappers_pb';
import {
  ProportionalElectionBallotCandidate,
  ProportionalElectionResultBallot,
  ProportionalElectionResultBundle,
  ProportionalElectionResultBundleDetails,
  ProportionalElectionResultBundleProto,
  ProportionalElectionResultBundles,
  ProportionalElectionResultBundlesProto,
  ProtocolExport,
  ProtocolExportProto,
} from '../models';
import { ProportionalElectionResultBallotProto } from '../models/proportional-election-result.model';
import { ProportionalElectionBallotListPosition, ProportionalElectionBallotUiData } from './proportional-election-ballot-ui.service';
import { ProportionalElectionResultService } from './proportional-election-result.service';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { PoliticalBusinessResultBundleService } from './political-business-result-bundle.service';

@Injectable({
  providedIn: 'root',
})
export class ProportionalElectionResultBundleService extends GrpcService<ProportionalElectionResultBundleServicePromiseClient> {
  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
    super(ProportionalElectionResultBundleServicePromiseClient, env, grpcBackend);
  }

  public getBundles(electionResultId: string): Promise<ProportionalElectionResultBundles> {
    const req = new GetProportionalElectionResultBundlesRequest();
    req.setElectionResultId(electionResultId);
    return this.request(
      c => c.getBundles,
      req,
      r => this.mapToBundles(r),
    );
  }

  public getBundle(bundleId: string): Promise<ProportionalElectionResultBundleDetails> {
    const req = new GetProportionalElectionResultBundleRequest();
    req.setBundleId(bundleId);
    return this.request(
      c => c.getBundle,
      req,
      r => this.mapToBundleDetails(r),
    );
  }

  public getBallot(bundleId: string, ballotNumber: number): Promise<ProportionalElectionResultBallot> {
    const req = new GetProportionalElectionResultBallotRequest();
    req.setBallotNumber(ballotNumber);
    req.setBundleId(bundleId);
    return this.request(
      c => c.getBallot,
      req,
      r => this.mapToBallot(r),
    );
  }

  public createBundle(
    electionResultId: string,
    listId?: string,
    bundleNumber?: number,
  ): Promise<CreateProportionalElectionResultBundleResponse.AsObject> {
    const req = new CreateProportionalElectionResultBundleRequest();
    req.setElectionResultId(electionResultId);
    req.setListId(listId ?? '');
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
    const req = new DeleteProportionalElectionResultBundleRequest();
    req.setBundleId(bundleId);
    return this.requestEmptyResp(c => c.deleteBundle, req);
  }

  public async createBallot(bundleId: string, uiData: ProportionalElectionBallotUiData): Promise<number> {
    const req = new CreateProportionalElectionResultBallotRequest();
    req.setBundleId(bundleId);

    if (!uiData.automaticEmptyVoteCounting) {
      const emptyVoteCountValue = new Int32Value();
      emptyVoteCountValue.setValue(uiData.userEnteredEmptyVoteCount);
      req.setEmptyVoteCount(emptyVoteCountValue);
    }
    req.setCandidatesList(this.mapToCreateUpdateCandidatesRequest(uiData.listPositions));
    return await this.request(
      c => c.createBallot,
      req,
      r => r.getBallotNumber(),
    );
  }

  public async updateBallot(bundleId: string, ballotNumber: number, uiData: ProportionalElectionBallotUiData): Promise<void> {
    const req = new UpdateProportionalElectionResultBallotRequest();
    req.setBundleId(bundleId);
    req.setBallotNumber(ballotNumber);

    if (!uiData.automaticEmptyVoteCounting) {
      const emptyVoteCountValue = new Int32Value();
      emptyVoteCountValue.setValue(uiData.userEnteredEmptyVoteCount);
      req.setEmptyVoteCount(emptyVoteCountValue);
    }
    req.setCandidatesList(this.mapToCreateUpdateCandidatesRequest(uiData.listPositions));
    await this.request(
      c => c.updateBallot,
      req,
      r => r,
    );
  }

  public async deleteBallot(bundleId: string, ballotNumber: number): Promise<void> {
    const req = new DeleteProportionalElectionResultBallotRequest();
    req.setBundleId(bundleId);
    req.setBallotNumber(ballotNumber);
    await this.requestEmptyResp(c => c.deleteBallot, req);
  }

  public async bundleSubmissionFinished(bundleId: string): Promise<void> {
    const req = new ProportionalElectionResultBundleSubmissionFinishedRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.bundleSubmissionFinished, req);
  }

  public async bundleCorrectionFinished(bundleId: string): Promise<void> {
    const req = new ProportionalElectionResultBundleSubmissionFinishedRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.bundleCorrectionFinished, req);
  }

  public async succeedBundleReview(bundleIds: string[]): Promise<void> {
    const req = new SucceedProportionalElectionBundleReviewRequest();
    req.setBundleIdsList(bundleIds);
    await this.requestEmptyResp(c => c.succeedBundleReview, req);
  }

  public async rejectBundleReview(bundleId: string): Promise<void> {
    const req = new RejectProportionalElectionBundleReviewRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.rejectBundleReview, req);
  }

  private mapToBundles(proto: ProportionalElectionResultBundlesProto): ProportionalElectionResultBundles {
    return {
      politicalBusinessResult: ProportionalElectionResultService.mapToProportionalElectionResult(proto.getElectionResult()!),
      bundles: proto.getBundlesList().map(x => this.mapToBundle(x)),
    };
  }

  private mapToBundleDetails(proto: GetProportionalElectionResultBundleResponse): ProportionalElectionResultBundleDetails {
    return {
      electionResult: ProportionalElectionResultService.mapToProportionalElectionResult(proto.getElectionResult()!),
      bundle: this.mapToBundle(proto.getBundle()!),
    };
  }

  private mapToBundle(proto: ProportionalElectionResultBundleProto): ProportionalElectionResultBundle {
    const obj = proto.toObject();
    return {
      ...obj,
      createdBy: obj.createdBy!,
      ballotNumbersToReview: obj.ballotNumbersToReviewList,
      protocolExport: this.mapToProtocolExport(proto.getProtocolExport()),
      logs: proto.getLogsList().map(x => PoliticalBusinessResultBundleService.mapToPoliticalBusinessResultBundleLog(x)),
    };
  }

  private mapToBallot(proto: ProportionalElectionResultBallotProto): ProportionalElectionResultBallot {
    const obj = proto.toObject();
    return {
      ...obj,
      isNew: false,
      candidates: obj.candidatesList.map(x => ({
        ...x,
        accumulated: false,
        descriptionWithoutDots: x.description.replace(/\./g, ''),
      })),
    };
  }

  private mapToCreateUpdateCandidatesRequest(
    positions: ProportionalElectionBallotListPosition[],
  ): CreateUpdateProportionalElectionResultBallotCandidateRequest[] {
    const result: CreateUpdateProportionalElectionResultBallotCandidateRequest[] = [];
    for (const position of positions) {
      if (position.listCandidate && !position.listCandidate.removedFromList) {
        result.push(this.mapToCreateUpdateCandidateRequest(position, position.listCandidate));
      }

      if (position.replacementCandidate) {
        result.push(this.mapToCreateUpdateCandidateRequest(position, position.replacementCandidate));
      }
    }
    return result;
  }

  private mapToCreateUpdateCandidateRequest(
    { position }: ProportionalElectionBallotListPosition,
    { id, onList }: ProportionalElectionBallotCandidate,
  ): CreateUpdateProportionalElectionResultBallotCandidateRequest {
    const req = new CreateUpdateProportionalElectionResultBallotCandidateRequest();
    req.setCandidateId(id);
    req.setPosition(position);
    req.setOnList(onList);
    return req;
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
