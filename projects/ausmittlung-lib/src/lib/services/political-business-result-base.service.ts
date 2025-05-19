/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SecondFactorTransaction } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import { EnterPoliticalBusinessCountOfVotersRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/count_of_voters_requests_pb';
import { GrpcStreamingService } from '@abraxas/voting-lib';
import { Observable } from 'rxjs';
import { CountingCircleResult, PoliticalBusinessNullableCountOfVoters } from '../models';
import { createInt32Value } from './utils/proto.utils';

export abstract class PoliticalBusinessResultBaseService<
  T extends CountingCircleResult,
  TClient,
  TStreamingClient,
> extends GrpcStreamingService<TClient, TStreamingClient> {
  public abstract get(politicalBusinessId: string, countingCircleId: string): Promise<T>;

  public abstract prepareSubmissionFinished(resultId: string): Promise<SecondFactorTransaction>;

  public abstract submissionFinished(resultId: string, secondFactorTransactionId: string): Observable<void>;

  public abstract resetToSubmissionFinished(resultId: string): Promise<void>;

  public abstract prepareCorrectionFinished(resultId: string): Promise<SecondFactorTransaction>;

  public abstract correctionFinished(resultId: string, comment: string, secondFactorTransactionId: string): Observable<void>;

  public abstract flagForCorrection(resultId: string, comment: string): Promise<void>;

  public abstract auditedTentatively(resultIds: string[]): Promise<void>;

  public abstract plausibilise(resultIds: string[]): Promise<void>;

  public abstract resetToAuditedTentatively(resultIds: string[]): Promise<void>;

  public abstract submissionFinishedAndAuditedTentatively(resultId: string): Promise<void>;

  public abstract correctionFinishedAndAuditedTentatively(resultId: string): Promise<void>;

  public abstract publish(resultIds: string[]): Promise<void>;

  public abstract unpublish(resultIds: string[]): Promise<void>;

  public abstract resetToSubmissionFinishedAndFlagForCorrection(resultId: string): Promise<void>;

  protected mapToCountOfVotersProto(countOfVoters: PoliticalBusinessNullableCountOfVoters): EnterPoliticalBusinessCountOfVotersRequest {
    const countOfVotersProto = new EnterPoliticalBusinessCountOfVotersRequest();
    countOfVotersProto.setConventionalAccountedBallots(createInt32Value(countOfVoters.conventionalSubTotal.accountedBallots));
    countOfVotersProto.setConventionalBlankBallots(createInt32Value(countOfVoters.conventionalSubTotal.blankBallots));
    countOfVotersProto.setConventionalInvalidBallots(createInt32Value(countOfVoters.conventionalSubTotal.invalidBallots));
    countOfVotersProto.setConventionalReceivedBallots(createInt32Value(countOfVoters.conventionalSubTotal.receivedBallots));
    return countOfVotersProto;
  }
}
