/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { Component, Input, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BallotNumberGeneration, MajorityElectionResultEntryParams, ProportionalElectionResultEntryParams } from '../../models';

@Component({
  selector: 'vo-ausm-election-result-entry-params',
  templateUrl: './election-result-entry-params.component.html',
  styleUrls: ['./election-result-entry-params.component.scss'],
  standalone: false,
})
export class ElectionResultEntryParamsComponent {
  private readonly i18n = inject(TranslateService);

  @Input()
  public resultEntryParams!: MajorityElectionResultEntryParams | ProportionalElectionResultEntryParams;

  @Input()
  public enforceEmptyVoteCounting: boolean = true;

  @Input()
  public enforceCandidateCheckDigit: boolean = true;

  @Input()
  public useCandidateCheckDigit: boolean = false;

  public automaticBallotBundleNumberGenerationChoices: RadioButton[];
  public automaticBallotNumberGenerationChoices: RadioButton[];
  public automaticEmptyVoteCountingChoices: RadioButton[];

  constructor() {
    this.automaticBallotBundleNumberGenerationChoices = [
      {
        value: true,
        displayText: this.i18n.instant('ELECTION.RESULT_ENTRY.BALLOT_BUNDLE_NUMBER_GENERATION.AUTOMATIC'),
      },
      {
        value: false,
        displayText: this.i18n.instant('ELECTION.RESULT_ENTRY.BALLOT_BUNDLE_NUMBER_GENERATION.MANUAL'),
      },
    ];
    this.automaticBallotNumberGenerationChoices = [
      {
        value: true,
        displayText: this.i18n.instant('ELECTION.RESULT_ENTRY.BALLOT_NUMBER_GENERATION.AUTOMATIC'),
      },
      {
        value: false,
        displayText: this.i18n.instant('ELECTION.RESULT_ENTRY.BALLOT_NUMBER_GENERATION.MANUAL'),
      },
    ];
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
}
