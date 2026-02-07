/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContestCountingCircleElectorateServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/contest_counting_circle_electorate_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { CountingCircleElectorate } from '../models';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import {
  CreateUpdateContestCountingCircleElectorateRequest,
  UpdateContestCountingCircleElectoratesRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/contest_counting_circle_electorate_requests_pb';

@Injectable({
  providedIn: 'root',
})
export class ContestCountingCircleElectorateService extends GrpcService<ContestCountingCircleElectorateServicePromiseClient> {
  constructor() {
    const grpcBackend = inject(GrpcBackendService);
    const env = inject<GrpcEnvironment>(GRPC_ENV_INJECTION_TOKEN);

    super(ContestCountingCircleElectorateServicePromiseClient, env, grpcBackend);
  }

  public updateElectorates(electorates: CountingCircleElectorate[], contestId: string, countingCircleId: string): Promise<void> {
    const req = this.mapToRequest(electorates, contestId, countingCircleId);
    return this.requestEmptyResp(c => c.updateElectorates, req);
  }

  private mapToRequest(
    electorates: CountingCircleElectorate[],
    contestId: string,
    countingCircleId: string,
  ): UpdateContestCountingCircleElectoratesRequest {
    const request = new UpdateContestCountingCircleElectoratesRequest();
    request.setContestId(contestId);
    request.setCountingCircleId(countingCircleId);

    for (const electorate of electorates) {
      const elecReq = new CreateUpdateContestCountingCircleElectorateRequest();
      elecReq.setDomainOfInfluenceTypesList(electorate.domainOfInfluenceTypesList);
      request.addElectorates(elecReq);
    }

    return request;
  }
}
