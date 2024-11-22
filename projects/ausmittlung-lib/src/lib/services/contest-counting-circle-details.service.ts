/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContestCountingCircleDetailsServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/contest_counting_circle_details_service_grpc_web_pb';
import { UpdateContestCountingCircleDetailsRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/contest_counting_circle_details_requests_pb';
import { UpdateCountOfVotersInformationSubTotalRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/count_of_voters_requests_pb';
import { UpdateVotingCardResultDetailRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/voting_cards_requests_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import {
  ContestCountingCircleDetails,
  CountOfVotersInformation,
  CountOfVotersInformationProto,
  CountOfVotersInformationSubTotal,
  CountOfVotersInformationSubTotalProto,
  VotingCardResultDetail,
  VotingCardResultDetailProto,
} from '../models';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { createInt32Value } from './utils/proto.utils';
import { ValidationMappingService } from './validation-mapping.service';

@Injectable({
  providedIn: 'root',
})
export class ContestCountingCircleDetailsService extends GrpcService<ContestCountingCircleDetailsServicePromiseClient> {
  constructor(
    grpcBackend: GrpcBackendService,
    @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment,
    private readonly validationMapping: ValidationMappingService,
  ) {
    super(ContestCountingCircleDetailsServicePromiseClient, env, grpcBackend);
  }

  public static mapToCountOfVotersInformation(data: CountOfVotersInformationProto): CountOfVotersInformation {
    return {
      totalCountOfVoters: data.getTotalCountOfVoters(),
      subTotalInfoList: data.getSubTotalInfoList().map(x => ContestCountingCircleDetailsService.mapToCountOfVotersInformationSubTotal(x)),
    };
  }

  public static mapToVotingCard(data: VotingCardResultDetailProto): VotingCardResultDetail {
    const protoObj = data.toObject();
    return {
      ...protoObj,
      countOfReceivedVotingCards: protoObj.countOfReceivedVotingCards?.value,
    };
  }

  private static mapToCountOfVotersInformationSubTotal(data: CountOfVotersInformationSubTotalProto): CountOfVotersInformationSubTotal {
    const protoObj = data.toObject();
    return {
      ...protoObj,
      countOfVoters: protoObj.countOfVoters?.value,
    };
  }

  public updateDetails(details: ContestCountingCircleDetails): Promise<void> {
    const req = this.mapToRequest(details);
    return this.requestEmptyResp(c => c.updateDetails, req);
  }

  private mapToRequest(details: ContestCountingCircleDetails): UpdateContestCountingCircleDetailsRequest {
    const request = new UpdateContestCountingCircleDetailsRequest();
    request.setContestId(details.contestId);
    request.setCountingCircleId(details.countingCircleId);
    request.setCountingMachine(details.countingMachine);

    for (const vcDetail of details.votingCards) {
      const vcDetailReq = new UpdateVotingCardResultDetailRequest();
      vcDetailReq.setChannel(vcDetail.channel);
      vcDetailReq.setCountOfReceivedVotingCards(createInt32Value(vcDetail.countOfReceivedVotingCards));
      vcDetailReq.setValid(vcDetail.valid);
      vcDetailReq.setDomainOfInfluenceType(vcDetail.domainOfInfluenceType);
      request.addVotingCards(vcDetailReq);
    }

    for (const subtotal of details.countOfVotersInformation.subTotalInfoList) {
      const countOfVotersReq = new UpdateCountOfVotersInformationSubTotalRequest();
      countOfVotersReq.setCountOfVoters(createInt32Value(subtotal.countOfVoters));
      countOfVotersReq.setVoterType(subtotal.voterType);
      countOfVotersReq.setSex(subtotal.sex);
      request.addCountOfVoters(countOfVotersReq);
    }

    return request;
  }
}
