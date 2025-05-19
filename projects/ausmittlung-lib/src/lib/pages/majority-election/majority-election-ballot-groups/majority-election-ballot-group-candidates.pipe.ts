/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MajorityElectionBallotGroupEntry, MajorityElectionCandidate } from '../../../models';

@Pipe({
  name: 'majorityElectionBallotGroupCandidates',
  standalone: false,
})
export class MajorityElectionBallotGroupCandidatesPipe implements PipeTransform {
  private readonly individualCandidate: MajorityElectionCandidate;

  constructor(readonly i18n: TranslateService) {
    const individualCandidateName = i18n.instant('MAJORITY_ELECTION.INDIVIDUAL');
    this.individualCandidate = {
      id: '',
      number: '999',
      description: individualCandidateName,
      politicalLastName: individualCandidateName,
      politicalFirstName: '',
      firstName: '',
      lastName: '',
      party: '',
      position: 0,
      checkDigit: 0,
    };
  }

  public transform(ballotGroupEntry: MajorityElectionBallotGroupEntry): MajorityElectionCandidate[] {
    if (ballotGroupEntry.individualCandidatesVoteCount === 0) {
      return ballotGroupEntry.candidates;
    }

    return [...ballotGroupEntry.candidates, this.individualCandidate];
  }
}
