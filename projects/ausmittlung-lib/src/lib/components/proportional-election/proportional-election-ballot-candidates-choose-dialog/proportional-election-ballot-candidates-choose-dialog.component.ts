/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { ProportionalElectionCandidate } from '../../../models';
import {
  ElectionBallotCandidateChoice,
  ElectionBallotCandidatesChooseDialogComponent,
} from '../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component';

@Component({
  selector: 'vo-ausm-proportional-election-ballot-candidates-choose-dialog',
  templateUrl: '../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component.html',
  styleUrls: ['../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotCandidatesChooseDialogComponent extends ElectionBallotCandidatesChooseDialogComponent<ProportionalElectionCandidate> {
  protected buildCandidateChoice(
    candidate: ProportionalElectionCandidate,
    candidateCheckDigit: boolean,
  ): ElectionBallotCandidateChoice<ProportionalElectionCandidate> {
    const checkDigit = candidateCheckDigit ? candidate.checkDigit : '';
    const number = candidate.numberIncludingList + checkDigit;
    const name = `${candidate.politicalLastName} ${candidate.politicalFirstName}`;
    const searchNumber = candidate.listNumber + candidate.number + checkDigit;
    return {
      candidate,
      number,
      name,
      partyOrList: candidate.listDescription,
      queryable: `${candidate.description} ${candidate.listDescription} ${number} ${searchNumber}`.toUpperCase(),
    };
  }

  protected noReplacementLabel = 'ELECTION.BALLOT_DETAIL.REPLACE_CANDIDATE_NO_REPLACEMENT_LIST';
}
