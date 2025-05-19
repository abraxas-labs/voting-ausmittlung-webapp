/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  CreateUpdateVoteResultBallotQuestionAnswerRequest,
  CreateUpdateVoteResultBallotTieBreakQuestionAnswerRequest,
  CreateVoteResultBallotRequest,
  CreateVoteResultBundleRequest,
  DeleteVoteResultBallotRequest,
  DeleteVoteResultBundleRequest,
  GetVoteResultBallotRequest,
  GetVoteResultBundleRequest,
  GetVoteResultBundlesRequest,
  RejectVoteBundleReviewRequest,
  SucceedVoteBundleReviewRequest,
  UpdateVoteResultBallotRequest,
  VoteResultBundleCorrectionFinishedRequest,
  VoteResultBundleSubmissionFinishedRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/vote_result_bundle_requests_pb';
import {
  CreateVoteResultBundleResponse,
  GetVoteResultBundleResponse,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/responses/vote_result_bundle_responses_pb';
import { VoteResultBundleServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/vote_result_bundle_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Int32Value } from 'google-protobuf/google/protobuf/wrappers_pb';
import {
  BallotQuestionAnswer,
  PoliticalBusinessResultBundle,
  ProtocolExport,
  ProtocolExportProto,
  TieBreakQuestionAnswer,
  VoteResultBallot,
  VoteResultBallotProto,
  VoteResultBallotQuestionAnswer,
  VoteResultBallotTieBreakQuestionAnswer,
  VoteResultBundleDetails,
  VoteResultBundleProto,
  VoteResultBundles,
  VoteResultBundlesProto,
} from '../models';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { VoteResultService } from './vote-result.service';
import { PoliticalBusinessResultBundleService } from './political-business-result-bundle.service';

@Injectable({
  providedIn: 'root',
})
export class VoteResultBundleService extends GrpcService<VoteResultBundleServicePromiseClient> {
  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
    super(VoteResultBundleServicePromiseClient, env, grpcBackend);
  }

  public getBundles(ballotResultId: string): Promise<VoteResultBundles> {
    const req = new GetVoteResultBundlesRequest();
    req.setBallotResultId(ballotResultId);
    return this.request(
      c => c.getBundles,
      req,
      r => this.mapToBundles(r),
    );
  }

  public getBundle(bundleId: string): Promise<VoteResultBundleDetails> {
    const req = new GetVoteResultBundleRequest();
    req.setBundleId(bundleId);
    return this.request(
      c => c.getBundle,
      req,
      r => this.mapToBundleDetails(r),
    );
  }

  public getBallot(bundleId: string, ballotNumber: number): Promise<VoteResultBallot> {
    const req = new GetVoteResultBallotRequest();
    req.setBallotNumber(ballotNumber);
    req.setBundleId(bundleId);
    return this.request(
      c => c.getBallot,
      req,
      r => this.mapToBallot(r),
    );
  }

  public createBundle(
    voteResultId: string,
    ballotResultId: string,
    bundleNumber?: number,
  ): Promise<CreateVoteResultBundleResponse.AsObject> {
    const req = new CreateVoteResultBundleRequest();
    req.setVoteResultId(voteResultId);
    req.setBallotResultId(ballotResultId);
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

  public deleteBundle(bundleId: string, ballotResultId: string): Promise<void> {
    const req = new DeleteVoteResultBundleRequest();
    req.setBundleId(bundleId);
    req.setBallotResultId(ballotResultId);
    return this.requestEmptyResp(c => c.deleteBundle, req);
  }

  public async createBallot(bundleId: string, ballot: VoteResultBallot): Promise<number> {
    const req = new CreateVoteResultBallotRequest();
    this.mapToBallotsRequest(req, bundleId, ballot);
    return await this.request(
      c => c.createBallot,
      req,
      r => r.getBallotNumber(),
    );
  }

  public async updateBallot(bundleId: string, ballot: VoteResultBallot): Promise<void> {
    const req = new UpdateVoteResultBallotRequest();
    req.setBallotNumber(ballot.number);
    this.mapToBallotsRequest(req, bundleId, ballot);
    await this.request(
      c => c.updateBallot,
      req,
      r => r,
    );
  }

  public async deleteBallot(bundleId: string, ballotNumber: number): Promise<void> {
    const req = new DeleteVoteResultBallotRequest();
    req.setBundleId(bundleId);
    req.setBallotNumber(ballotNumber);
    await this.requestEmptyResp(c => c.deleteBallot, req);
  }

  public async bundleSubmissionFinished(bundleId: string): Promise<void> {
    const req = new VoteResultBundleSubmissionFinishedRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.bundleSubmissionFinished, req);
  }

  public async bundleCorrectionFinished(bundleId: string): Promise<void> {
    const req = new VoteResultBundleCorrectionFinishedRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.bundleCorrectionFinished, req);
  }

  public async succeedBundleReview(bundleIds: string[]): Promise<void> {
    const req = new SucceedVoteBundleReviewRequest();
    req.setBundleIdsList(bundleIds);
    await this.requestEmptyResp(c => c.succeedBundleReview, req);
  }

  public async rejectBundleReview(bundleId: string): Promise<void> {
    const req = new RejectVoteBundleReviewRequest();
    req.setBundleId(bundleId);
    await this.requestEmptyResp(c => c.rejectBundleReview, req);
  }

  private mapToBundles(proto: VoteResultBundlesProto): VoteResultBundles {
    return {
      politicalBusinessResult: VoteResultService.mapToVoteResult(proto.getVoteResult()!),
      ballotResult: VoteResultService.mapToBallotResult(proto.getBallotResult()!),
      bundles: proto.getBundlesList().map(x => this.mapToBundle(x)),
    };
  }

  private mapToBundleDetails(proto: GetVoteResultBundleResponse): VoteResultBundleDetails {
    return {
      politicalBusinessResult: VoteResultService.mapToVoteResult(proto.getVoteResult()!),
      ballotResult: VoteResultService.mapToBallotResult(proto.getBallotResult()!),
      bundle: this.mapToBundle(proto.getBundle()!),
    };
  }

  private mapToBundle(proto: VoteResultBundleProto): PoliticalBusinessResultBundle {
    const obj = proto.toObject();
    return {
      ...obj,
      createdBy: obj.createdBy!,
      ballotNumbersToReview: obj.ballotNumbersToReviewList,
      protocolExport: this.mapToProtocolExport(proto.getProtocolExport()),
      logs: proto.getLogsList().map(x => PoliticalBusinessResultBundleService.mapToPoliticalBusinessResultBundleLog(x)),
    };
  }

  private mapToBallotsRequest(
    request: CreateVoteResultBallotRequest | UpdateVoteResultBallotRequest,
    bundleId: string,
    ballot: VoteResultBallot,
  ): void {
    request.setBundleId(bundleId);
    request.setQuestionAnswersList(ballot.questionAnswers.map(this.mapToCreateUpdateVoteResultBallotQuestionAnswerRequest));
    request.setTieBreakQuestionAnswersList(
      ballot.tieBreakQuestionAnswers.map(this.mapToCreateUpdateVoteResultBallotTieBreakQuestionAnswerRequest),
    );
  }

  private mapToBallot(response: VoteResultBallotProto): VoteResultBallot {
    const obj = response.toObject();
    return {
      ...obj,
      isNew: false,
      questionAnswers: obj.questionAnswersList.map(x => ({ question: x.question!, answer: x.answer })),
      tieBreakQuestionAnswers: obj.tieBreakQuestionAnswersList.map(x => ({ question: x.question!, answer: x.answer })),
    };
  }

  private mapToCreateUpdateVoteResultBallotQuestionAnswerRequest(
    ballotAnswer: VoteResultBallotQuestionAnswer,
  ): CreateUpdateVoteResultBallotQuestionAnswerRequest {
    const req = new CreateUpdateVoteResultBallotQuestionAnswerRequest();
    req.setQuestionNumber(ballotAnswer.question.number);
    req.setAnswer(ballotAnswer.answer ?? BallotQuestionAnswer.BALLOT_QUESTION_ANSWER_UNSPECIFIED);
    return req;
  }

  private mapToCreateUpdateVoteResultBallotTieBreakQuestionAnswerRequest(
    ballotAnswer: VoteResultBallotTieBreakQuestionAnswer,
  ): CreateUpdateVoteResultBallotTieBreakQuestionAnswerRequest {
    const req = new CreateUpdateVoteResultBallotTieBreakQuestionAnswerRequest();
    req.setQuestionNumber(ballotAnswer.question.number);
    req.setAnswer(ballotAnswer.answer ?? TieBreakQuestionAnswer.TIE_BREAK_QUESTION_ANSWER_UNSPECIFIED);
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
