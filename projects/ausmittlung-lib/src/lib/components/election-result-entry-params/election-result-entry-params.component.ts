/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BallotNumberGeneration, MajorityElectionResultEntryParams, ProportionalElectionResultEntryParams } from '../../models';

@Component({
  selector: 'vo-ausm-election-result-entry-params',
  templateUrl: './election-result-entry-params.component.html',
  styleUrls: ['./election-result-entry-params.component.scss'],
  standalone: false,
})
export class ElectionResultEntryParamsComponent {
  @Input()
  public resultEntryParams!: MajorityElectionResultEntryParams | ProportionalElectionResultEntryParams;

  @Input()
  public enforceEmptyVoteCounting: boolean = true;

  @Input()
  public enforceCandidateCheckDigit: boolean = true;

  @Input()
  public useCandidateCheckDigit: boolean = false;

  public automaticEmptyVoteCountingChoices: RadioButton[];

  constructor(private readonly i18n: TranslateService) {
    this.automaticEmptyVoteCountingChoices = [
      {
        value: true,
        displayText: this.i18n.instant('ELECTION.RESULT_ENTRY.AUTOMATIC_EMPTY_VOTE_COUNTING.AUTOMATIC'),
      },
      {
        value: false,
        displayText: this.i18n.instant('ELECTION.RESULT_ENTRY.AUTOMATIC_EMPTY_VOTE_COUNTING.MANUAL'),
      },
    ];
  }

  public updateAutomaticBallotBundleNumberGeneration(value: boolean): void {
    this.resultEntryParams.automaticBallotBundleNumberGeneration = value;
    if (
      !value &&
      this.resultEntryParams.ballotNumberGeneration !== BallotNumberGeneration.BALLOT_NUMBER_GENERATION_RESTART_FOR_EACH_BUNDLE
    ) {
      this.resultEntryParams.ballotNumberGeneration = BallotNumberGeneration.BALLOT_NUMBER_GENERATION_RESTART_FOR_EACH_BUNDLE;
    }
  }
}
