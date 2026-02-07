/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RpcError } from 'grpc-web';

const ERROR_TYPE_SEPARATOR = ':';

export function isErrorType(error: any, type: string): boolean {
  const grpcError = error as RpcError;
  const errorType = grpcError?.message?.split(ERROR_TYPE_SEPARATOR)[0];

  return errorType === type;
}
