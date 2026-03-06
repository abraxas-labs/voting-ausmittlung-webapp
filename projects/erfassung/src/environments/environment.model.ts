/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthenticationConfig, AuthorizationConfig, TenantConfig, UserConfig } from '@abraxas/base-components';
import { Environments, GrpcEnvironment } from '@abraxas/voting-lib';
import { RuntimeConfigPollingConfig, EventLogConfig } from 'ausmittlung-lib';

export interface Environment extends TenantConfig, UserConfig, AuthorizationConfig, GrpcEnvironment {
  production: boolean;
  env: Environments;
  authenticationConfig: AuthenticationConfig & Required<Pick<AuthenticationConfig, 'clientId' | 'issuer' | 'scope'>>;
  grpcApiEndpoint: string;
  restApiEndpoint: string;
  votingBasisWebApp: string;
  votingAusmittlungMonitoringWebApp: string;
  includeDelegations: boolean;
  runtimeConfigPolling: RuntimeConfigPollingConfig;
  eventLogConfig: EventLogConfig;
}
