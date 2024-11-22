/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, createUrlTreeFromSnapshot, UrlTree } from '@angular/router';
import { ContestState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contest_pb';
import { ContestService } from 'ausmittlung-lib';
import { AuthorizationService, Tenant } from '@abraxas/base-components';

@Injectable({
  providedIn: 'root',
})
export class ContestDateGuard {
  private alreadyRedirected: boolean = false;
  private tenant?: Tenant;

  constructor(
    private readonly contestService: ContestService,
    private readonly auth: AuthorizationService,
  ) {}

  public async canActivate(currentRoute: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    if (this.alreadyRedirected) {
      return true;
    }

    const contests = await this.contestService.listSummaries(ContestState.CONTEST_STATE_ACTIVE);
    const today = new Date().setHours(0, 0, 0, 0);
    for (const contest of contests) {
      const contestDate = contest.date?.setHours(0, 0, 0, 0);
      if (contestDate === today) {
        const countingCircles = await this.contestService.getAccessibleCountingCircles(contest.id);
        this.tenant = await this.auth.getActiveTenant();
        if (countingCircles.length > 0 && countingCircles[0].responsibleAuthority?.secureConnectId === this.tenant.id) {
          this.alreadyRedirected = true;
          return createUrlTreeFromSnapshot(currentRoute, [contest.id, countingCircles[0].id]);
        }
      }
    }

    return true;
  }
}
