/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContestCountingCircleContactPersonServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/contest_counting_circle_contact_person_service_grpc_web_pb';
import { EnterContactPersonRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/contact_person_requests_pb';
import {
  CreateContestCountingCircleContactPersonRequest,
  UpdateContestCountingCircleContactPersonRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/contest_counting_circle_contact_person_requests_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { ContactPerson } from '../models';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class ContestCountingCircleContactPersonService extends GrpcService<ContestCountingCircleContactPersonServicePromiseClient> {
  constructor() {
    const grpcBackend = inject(GrpcBackendService);
    const env = inject<GrpcEnvironment>(GRPC_ENV_INJECTION_TOKEN);

    super(ContestCountingCircleContactPersonServicePromiseClient, env, grpcBackend);
  }

  public create(
    contestId: string,
    countingCircleId: string,
    contactPersonDuringEvent: ContactPerson,
    contactPersonSameDuringEventAsAfter: boolean,
    contactPersonAfterEvent?: ContactPerson,
  ): Promise<string> {
    const req = new CreateContestCountingCircleContactPersonRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    req.setContactPersonDuringEvent(this.mapToEnterContactPersonRequest(contactPersonDuringEvent));
    req.setContactPersonSameDuringEventAsAfter(contactPersonSameDuringEventAsAfter);
    req.setContactPersonAfterEvent(this.mapToEnterContactPersonRequest(contactPersonAfterEvent));
    return this.request(
      c => c.create,
      req,
      resp => resp.getId(),
    );
  }

  public update(
    id: string,
    contactPersonDuringEvent: ContactPerson,
    contactPersonSameDuringEventAsAfter: boolean,
    contactPersonAfterEvent?: ContactPerson,
  ): Promise<void> {
    const req = new UpdateContestCountingCircleContactPersonRequest();
    req.setId(id);
    req.setContactPersonDuringEvent(this.mapToEnterContactPersonRequest(contactPersonDuringEvent));
    req.setContactPersonSameDuringEventAsAfter(contactPersonSameDuringEventAsAfter);
    req.setContactPersonAfterEvent(this.mapToEnterContactPersonRequest(contactPersonAfterEvent));
    return this.requestEmptyResp(c => c.update, req);
  }

  private mapToEnterContactPersonRequest(data?: ContactPerson): EnterContactPersonRequest | undefined {
    if (!data) {
      return undefined;
    }

    const result = new EnterContactPersonRequest();
    result.setFirstName(data.firstName);
    result.setFamilyName(data.familyName);
    result.setPhone(data.phone);
    result.setMobilePhone(data.mobilePhone);
    result.setEmail(data.email);
    return result;
  }
}
