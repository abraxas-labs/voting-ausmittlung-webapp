/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, createUrlTreeFromSnapshot, UrlTree } from '@angular/router';
import { ContestState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contest_pb';
import { ContestService } from 'ausmittlung-lib';

@Injectable({
  providedIn: 'root',
})
export class ContestDateGuard {
  private readonly contestService = inject(ContestService);

  private alreadyRedirected: boolean = false;

  public async canActivate(currentRoute: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    if (this.alreadyRedirected) {
      return true;
    }

    const contests = await this.contestService.listSummaries(ContestState.CONTEST_STATE_ACTIVE);
    const today = new Date().setHours(0, 0, 0, 0);
    for (const contest of contests) {
      const contestDate = contest.date?.setHours(0, 0, 0, 0);
      if (contestDate === today) {
        this.alreadyRedirected = true;
        return createUrlTreeFromSnapshot(currentRoute, [contest.id]);
      }
    }

    return true;
  }
}
