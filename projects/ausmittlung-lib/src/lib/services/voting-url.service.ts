/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { PoliticalBusinessType } from '../models';
import { VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL } from '../tokens';
import { ThemeService } from '@abraxas/voting-lib';

@Injectable({
  providedIn: 'root',
})
export class VotingUrlService {
  private readonly votingAusmittlungMonitoringWebAppUrl = inject(VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL);
  private readonly themeService = inject(ThemeService);

  public getMonitoringProxyUrl(politicalBusinessType: PoliticalBusinessType, politicalBusinessId: string): string {
    const politicalBusinessTypeUrl = this.getPoliticalBusinessTypeUrl(politicalBusinessType);
    return (
      `${this.votingAusmittlungMonitoringWebAppUrl}/${this.themeService.theme$.value}/${politicalBusinessTypeUrl}/${politicalBusinessId}` +
      `?submissionFinishedAndAuditedTentatively=true`
    );
  }

  private getPoliticalBusinessTypeUrl(politicalBusinessType: PoliticalBusinessType): string {
    switch (politicalBusinessType) {
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE:
        return 'vote-end-results';
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION:
        return 'majority-election-end-results';
      case PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION:
        return 'proportional-election-end-results';
      default:
        throw new Error('invalid political business type');
    }
  }
}
