/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { InjectionToken } from '@angular/core';
import { GrpcEnvironment } from '@abraxas/voting-lib';
import { EventLogConfig, RuntimeConfigPollingConfig } from '../models';

export const GRPC_ENV_INJECTION_TOKEN: InjectionToken<GrpcEnvironment> = new InjectionToken<GrpcEnvironment>('grpc environment settings');
export const REST_API_URL_INJECTION_TOKEN: InjectionToken<string> = new InjectionToken<string>('rest api url');
export const RUNTIME_CONFIG_POLLING_CONFIG_INJECTION_TOKEN: InjectionToken<RuntimeConfigPollingConfig> =
  new InjectionToken<RuntimeConfigPollingConfig>('throttle polling config');
export const EVENT_LOG_CONFIG_INJECTION_TOKEN: InjectionToken<EventLogConfig> = new InjectionToken<EventLogConfig>('event log config');
