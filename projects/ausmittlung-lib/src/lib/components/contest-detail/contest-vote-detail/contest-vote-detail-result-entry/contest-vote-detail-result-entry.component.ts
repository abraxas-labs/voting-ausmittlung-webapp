/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { EnumUtil } from '@abraxas/voting-lib';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { isEqual } from 'lodash';
import { Vote, VoteResultEntry, VoteResultEntryParams } from '../../../../models';
import { VoteResultService } from '../../../../services/vote-result.service';

@Component({
  selector: 'vo-ausm-contest-vote-detail-result-entry',
  templateUrl: './contest-vote-detail-result-entry.component.html',
  styleUrls: ['./contest-vote-detail-result-entry.component.scss'],
})
export class ContestVoteDetailResultEntryComponent implements OnInit {
  public readonly resultEntries: typeof VoteResultEntry = VoteResultEntry;

  public readonly resultEntryVariants: RadioButton[];

  @Input()
  public readonly: boolean = true;

  @Input()
  public voteResultId: string = '';

  @Input()
  public vote!: Vote;

  @Input()
  public resultEntry!: VoteResultEntry;

  @Input()
  public resultEntryParams!: VoteResultEntryParams;

  @Output()
  public resultEntryChange: EventEmitter<VoteResultEntry> = new EventEmitter<VoteResultEntry>();

  @Output()
  public resultEntryParamsChange: EventEmitter<VoteResultEntryParams> = new EventEmitter<VoteResultEntryParams>();

  @Output()
  public done: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public resetResults: EventEmitter<void> = new EventEmitter<void>();

  public confirmationRequested: boolean = false;
  public isUpdatingResultEntry: boolean = false;

  public isInitialSetup: boolean = true;
  private originalResultEntry: VoteResultEntry = VoteResultEntry.VOTE_RESULT_ENTRY_UNSPECIFIED;
  private originalResultEntryParams!: VoteResultEntryParams;

  constructor(
    private readonly enums: EnumUtil,
    private readonly voteResultService: VoteResultService,
  ) {
    this.resultEntryVariants = enums
      .getArrayWithDescriptions<VoteResultEntry>(VoteResultEntry, 'VOTE.RESULT_ENTRY.LONG.')
      .map(x => ({ displayText: x.description, value: x.value }) as RadioButton);
  }

  public ngOnInit(): void {
    this.isInitialSetup = this.resultEntry === VoteResultEntry.VOTE_RESULT_ENTRY_UNSPECIFIED;
    if (this.isInitialSetup) {
      this.resultEntry = this.vote.resultEntry;
    }

    this.resultEntryParams = { ...this.resultEntryParams };

    if (this.isInitialSetup || !this.resultEntryParams) {
      const { ballotBundleSampleSizePercent, automaticBallotBundleNumberGeneration, reviewProcedure } = this.vote;
      this.resultEntryParams = {
        ballotBundleSampleSizePercent,
        automaticBallotBundleNumberGeneration,
        reviewProcedure,
      };
    }

    this.originalResultEntry = this.resultEntry;
    this.originalResultEntryParams = { ...this.resultEntryParams };
    for (const variant of this.resultEntryVariants) {
      variant.disabled = this.vote.enforceResultEntryForCountingCircles;
    }
  }

  public async save(): Promise<void> {
    if (
      !this.isInitialSetup &&
      this.resultEntry === this.originalResultEntry &&
      isEqual(this.resultEntryParams, this.originalResultEntryParams)
    ) {
      this.done.emit();
      return;
    }

    if (this.isInitialSetup || this.confirmationRequested) {
      await this.updateResultEntry();
      return;
    }

    this.confirmationRequested = true;
  }

  public cancel(done: boolean = false): void {
    this.confirmationRequested = false;
    this.resultEntry = this.originalResultEntry;
    this.resultEntryParams = { ...this.originalResultEntryParams };

    if (done) {
      this.done.emit();
    }
  }

  private async updateResultEntry(): Promise<void> {
    try {
      this.isUpdatingResultEntry = true;
      await this.voteResultService.defineEntry(this.voteResultId, this.resultEntry, this.resultEntryParams);
      this.originalResultEntry = this.resultEntry;
      this.originalResultEntryParams = { ...this.resultEntryParams };
      this.resultEntryChange.emit(this.resultEntry);
      this.resultEntryParamsChange.emit(this.resultEntryParams);
      this.resetResults.emit();
      this.done.emit();
    } finally {
      this.isUpdatingResultEntry = false;
    }
  }
}
