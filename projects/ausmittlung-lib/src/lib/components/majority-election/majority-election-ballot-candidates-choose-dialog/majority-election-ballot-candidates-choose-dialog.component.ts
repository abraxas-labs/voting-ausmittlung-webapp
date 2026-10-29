/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { MajorityElectionCandidate } from '../../../models';
import {
  ElectionBallotCandidateChoice,
  ElectionBallotCandidatesChooseDialogComponent,
} from '../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component';

@Component({
  selector: 'vo-ausm-majority-election-ballot-candidates-choose-dialog',
  templateUrl: '../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component.html',
  styleUrls: ['../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotCandidatesChooseDialogComponent extends ElectionBallotCandidatesChooseDialogComponent<MajorityElectionCandidate> {
  protected buildCandidateChoice(
    candidate: MajorityElectionCandidate,
    candidateCheckDigit: boolean,
  ): ElectionBallotCandidateChoice<MajorityElectionCandidate> {
    const checkDigit = candidateCheckDigit ? candidate.checkDigit : '';
    const number = candidate.number + checkDigit;
    const name = `${candidate.politicalLastName} ${candidate.politicalFirstName}`;
    return {
      candidate,
      number,
      name,
      partyOrList: candidate.party,
      queryable: `${name} ${candidate.party} ${number}`.toUpperCase(),
    };
  }

  protected noReplacementLabel = 'ELECTION.BALLOT_DETAIL.REPLACE_CANDIDATE_NO_REPLACEMENT_BALLOT_GROUP';
}
