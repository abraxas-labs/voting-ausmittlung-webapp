/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { EnterPoliticalBusinessCountOfVotersRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/count_of_voters_requests_pb';
import { GrpcStreamingService } from '@abraxas/voting-lib';
import { Observable } from 'rxjs';
import { CountingCircleResult, PoliticalBusinessNullableCountOfVoters, SecondFactorTransaction } from '../models';
import { createInt32Value } from './utils/proto.utils';

export abstract class PoliticalBusinessResultBaseService<
  T extends CountingCircleResult,
  TClient,
  TStreamingClient,
> extends GrpcStreamingService<TClient, TStreamingClient> {
  public abstract get(politicalBusinessId: string, countingCircleId: string): Promise<T>;

  public abstract prepareSubmissionFinished(resultId: string): Promise<SecondFactorTransaction>;

  public abstract submissionFinished(resultId: string, secondFactorTransactionId: string, otpCode?: string): Observable<void>;

  public abstract resetToSubmissionFinished(resultId: string): Promise<void>;

  public abstract prepareCorrectionFinished(resultId: string): Promise<SecondFactorTransaction>;

  public abstract correctionFinished(
    resultId: string,
    comment: string,
    secondFactorTransactionId: string,
    otpCode?: string,
  ): Observable<void>;

  public abstract flagForCorrection(resultId: string, comment: string): Promise<void>;

  public abstract auditedTentatively(resultIds: string[]): Promise<void>;

  public abstract plausibilise(resultIds: string[]): Promise<void>;

  public abstract resetToAuditedTentatively(resultIds: string[]): Promise<void>;

  public abstract prepareSubmissionFinishedAndAuditedTentatively(resultId: string): Promise<SecondFactorTransaction>;

  public abstract submissionFinishedAndAuditedTentatively(
    resultId: string,
    secondFactorTransactionId: string,
    otpCode?: string,
  ): Observable<void>;

  public abstract prepareCorrectionFinishedAndAuditedTentatively(resultId: string): Promise<SecondFactorTransaction>;

  public abstract correctionFinishedAndAuditedTentatively(
    resultId: string,
    secondFactorTransactionId: string,
    otpCode?: string,
  ): Observable<void>;

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
