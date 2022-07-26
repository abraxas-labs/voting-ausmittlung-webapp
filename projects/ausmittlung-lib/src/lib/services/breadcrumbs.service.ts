/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { Injectable } from '@angular/core';
import { ProportionalElectionResult } from '../models';

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
}

export interface BreadcrumbItem {
  name: string;
  link?: string | any[];
}
