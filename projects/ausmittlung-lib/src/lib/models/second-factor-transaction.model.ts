/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SecondFactorAuthorization } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/second_factor_authorization_pb';
import {
  SecondFactorTransaction as SecondFactorTransactionProto,
  SecondFactorTransactionNevisInfo as SecondFactorTransactionNevisInfoProto,
  SecondFactorTransactionProvider as SecondFactorTransactionProviderProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/second_factor_transaction_pb';
import { SecondFactorTransactionProvider } from '@abraxas/voting-lib';

export { SecondFactorTransactionProto, SecondFactorTransactionNevisInfoProto, SecondFactorTransactionProvider };

export interface SecondFactorTransaction extends Omit<SecondFactorTransactionProto.AsObject, 'availableProvidersList'> {
  availableProvidersList: SecondFactorTransactionProvider[];
}

export type SecondFactorTransactionNevisInfo = SecondFactorTransactionNevisInfoProto.AsObject;

export function mapToSecondFactorTransaction(proto: SecondFactorTransactionProto): SecondFactorTransaction {
  const obj = proto.toObject();
  return {
    ...obj,
    availableProvidersList: obj.availableProvidersList.map(x => {
      switch (x) {
        case SecondFactorTransactionProviderProto.SECOND_FACTOR_TRANSACTION_PROVIDER_NEVIS:
          return SecondFactorTransactionProvider.NEVIS;
        case SecondFactorTransactionProviderProto.SECOND_FACTOR_TRANSACTION_PROVIDER_OTP:
          return SecondFactorTransactionProvider.OTP;
        default:
          return SecondFactorTransactionProvider.UNSPECIFIED;
      }
    }),
  };
}

export function createSecondFactorAuthorization(
  secondFactorTransactionId: string | undefined,
  otpCode?: string,
): SecondFactorAuthorization | undefined {
  if (!secondFactorTransactionId) {
    return undefined;
  }

  const secondFactorAuthorization = new SecondFactorAuthorization();
  secondFactorAuthorization.setSecondFactorTransactionId(secondFactorTransactionId);
  if (otpCode) {
    secondFactorAuthorization.setOtpCode(otpCode);
  }
  return secondFactorAuthorization;
}
