/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { EnumUtil } from '@abraxas/voting-lib';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BallotNumberGeneration } from '../../models';

@Component({
  selector: 'vo-ausm-ballot-number-generation-selector',
  templateUrl: './ballot-number-generation-selector.component.html',
  standalone: false,
})
export class BallotNumberGenerationSelectorComponent {
  public readonly ballotNumberGenerationChoices: RadioButton[];

  @Input()
  public disabled: boolean = false;

  @Input()
  public ballotNumberGeneration: BallotNumberGeneration = BallotNumberGeneration.BALLOT_NUMBER_GENERATION_CONTINUOUS_FOR_ALL_BUNDLES;

  @Output()
  public ballotNumberGenerationChange: EventEmitter<BallotNumberGeneration> = new EventEmitter<BallotNumberGeneration>();

  constructor(enumUtil: EnumUtil) {
    this.ballotNumberGenerationChoices = enumUtil
      .getArrayWithDescriptions<BallotNumberGeneration>(BallotNumberGeneration, 'ELECTION.RESULT_ENTRY.BALLOT_NUMBER_GENERATION.TYPES.')
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));
  }
}
