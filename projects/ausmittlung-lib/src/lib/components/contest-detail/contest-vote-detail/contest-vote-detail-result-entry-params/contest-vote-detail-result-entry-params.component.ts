/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { VoteReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/vote_pb';
import { EnumUtil } from '@abraxas/voting-lib';
import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { VoteResultEntryParams } from '../../../../models';

@Component({
  selector: 'vo-ausm-contest-vote-detail-result-entry-params',
  templateUrl: './contest-vote-detail-result-entry-params.component.html',
  styleUrls: ['./contest-vote-detail-result-entry-params.component.scss'],
  standalone: false,
})
export class ContestVoteDetailResultEntryParamsComponent {
  @Input()
  public resultEntryParams!: VoteResultEntryParams;

  @Input()
  public enforceReviewProcedure: boolean = true;

  public automaticBallotBundleNumberGenerationChoices: RadioButton[];
  public reviewProcedureChoices: RadioButton[];

  constructor(
    private readonly i18n: TranslateService,
    enumUtil: EnumUtil,
  ) {
    this.automaticBallotBundleNumberGenerationChoices = [
      {
        value: true,
        displayText: this.i18n.instant('VOTE.RESULT_ENTRY.BALLOT_BUNDLE_NUMBER_GENERATION.AUTOMATIC'),
      },
      {
        value: false,
        displayText: this.i18n.instant('VOTE.RESULT_ENTRY.BALLOT_BUNDLE_NUMBER_GENERATION.MANUAL'),
      },
    ];
    this.reviewProcedureChoices = enumUtil
      .getArrayWithDescriptions<VoteReviewProcedure>(VoteReviewProcedure, 'VOTE.RESULT_ENTRY.REVIEW_PROCEDURE.TYPES.')
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));
  }
}
