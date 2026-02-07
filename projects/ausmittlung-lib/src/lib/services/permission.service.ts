/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { PermissionServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/permission_service_grpc_web_pb';
import { Injectable, inject } from '@angular/core';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class PermissionService extends GrpcService<PermissionServicePromiseClient> {
  private permissionCache?: string[];

  constructor() {
    const grpcBackend = inject(GrpcBackendService);
    const env = inject<GrpcEnvironment>(GRPC_ENV_INJECTION_TOKEN);

    super(PermissionServicePromiseClient, env, grpcBackend);
  }

  public async hasPermission(permission: string): Promise<boolean> {
    if (this.permissionCache === undefined) {
      this.permissionCache = await this.listPermissions();
    }

    return this.permissionCache.includes(permission);
  }

  private listPermissions(): Promise<string[]> {
    return this.request(
      c => c.list,
      new Empty(),
      r => r.getPermissionList(),
    );
  }
}
