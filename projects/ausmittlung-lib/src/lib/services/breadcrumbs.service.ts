/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import { Contest, CountingCircle, ProportionalElectionResult } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbsService {
  public readonly contestDetail: BreadcrumbItem[] = [
    {
      name: 'CONTEST.DETAIL.TITLE',
    },
  ];

  public forProportionalElectionResults(electionResult?: ProportionalElectionResult): BreadcrumbItem[] {
    return [
      {
        name: 'CONTEST.DETAIL.TITLE',
        link: !electionResult ? undefined : `../../../contests/${electionResult.election.contestId}/${electionResult.countingCircleId}`,
      },
      {
        name: 'PROPORTIONAL_ELECTION.RESULTS',
      },
    ];
  }

  public forExports(): BreadcrumbItem[] {
    return [{ name: 'CONTEST.DETAIL.TITLE', link: ['..'] }, { name: 'EXPORTS.BREADCRUMB_TITLE' }];
  }

  public forFinishSubmission(newZhFeaturesEnabled: boolean): BreadcrumbItem[] {
    return [
      { name: 'CONTEST.DETAIL.TITLE', link: ['..'] },
      { name: newZhFeaturesEnabled ? 'SUBMISSION_DONE.BREADCRUMB_TITLE' : 'SUBMISSION_DONE.BREADCRUMB_TITLE_OLD' },
    ];
  }
}

export interface BreadcrumbItem {
  name: string;
  link?: string | any[];
}
