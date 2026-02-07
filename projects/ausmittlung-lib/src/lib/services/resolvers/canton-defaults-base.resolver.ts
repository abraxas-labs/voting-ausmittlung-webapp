/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActivatedRouteSnapshot } from '@angular/router';
import { ContestCantonDefaults } from '../../models';
import { Directive, inject } from '@angular/core';
import { ContestService } from '../contest.service';
import { GetCantonDefaultsRequest } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/contest_requests_pb';

@Directive()
export abstract class CantonDefaultsBaseResolver {
  private readonly contestService = inject(ContestService);

  private cachedId?: string;
  private cachedCantonDefaults!: ContestCantonDefaults;

  public async resolve(route: ActivatedRouteSnapshot): Promise<ContestCantonDefaults> {
    const id = route.paramMap.get(this.idParam);
    if (!id) {
      throw new Error('id not set');
    }

    if (this.cachedId === id) {
      return this.cachedCantonDefaults;
    }

    const cantonDefaults = await this.contestService.getCantonDefaults(this.getCantonDefaultsRequest(id));
    this.cachedId = id;
    this.cachedCantonDefaults = cantonDefaults;
    return cantonDefaults;
  }

  protected abstract get idParam(): string;
  protected abstract getCantonDefaultsRequest(id: string): GetCantonDefaultsRequest;
}
