/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { MajorityElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_pb';
import { EnumUtil } from '@abraxas/voting-lib';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { isEqual } from 'lodash';
import { MajorityElection, MajorityElectionResultEntry, MajorityElectionResultEntryParams } from '../../../../models';
import { MajorityElectionResultService } from '../../../../services/majority-election-result.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'vo-ausm-contest-majority-election-detail-result-entry',
  templateUrl: './contest-majority-election-detail-result-entry.component.html',
  styleUrls: ['./contest-majority-election-detail-result-entry.component.scss'],
})
export class ContestMajorityElectionDetailResultEntryComponent implements OnInit, OnDestroy {
  public readonly resultEntries: typeof MajorityElectionResultEntry = MajorityElectionResultEntry;

  public readonly resultEntryVariants: RadioButton[];

  @Input()
  public readonly: boolean = true;

  @Input()
  public electionResultId: string = '';

  @Input()
  public election!: MajorityElection;

  @Input()
  public resultEntry!: MajorityElectionResultEntry;

  @Input()
  public resultEntryParams!: MajorityElectionResultEntryParams;

  @Output()
  public resultEntryChange: EventEmitter<MajorityElectionResultEntry> = new EventEmitter<MajorityElectionResultEntry>();

  @Output()
  public resultEntryParamsChange: EventEmitter<MajorityElectionResultEntryParams> = new EventEmitter<MajorityElectionResultEntryParams>();

  @Output()
  public done: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public resetResults: EventEmitter<void> = new EventEmitter<void>();

  public confirmationRequested: boolean = false;
  public isUpdatingResultEntry: boolean = false;

  public isInitialSetup: boolean = true;
  public reviewProcedureChoices: RadioButton[];
  private originalResultEntry: MajorityElectionResultEntry = MajorityElectionResultEntry.MAJORITY_ELECTION_RESULT_ENTRY_UNSPECIFIED;
  private originalResultEntryParams!: MajorityElectionResultEntryParams;
  public useCandidateCheckDigit: boolean = false;
  private readonly routeSubscription: Subscription;

  constructor(
    private readonly resultService: MajorityElectionResultService,
    enumUtil: EnumUtil,
    route: ActivatedRoute,
  ) {
    this.resultEntryVariants = enumUtil
      .getArrayWithDescriptions<MajorityElectionResultEntry>(MajorityElectionResultEntry, 'MAJORITY_ELECTION.RESULT_ENTRY.LONG.')
      .map(x => ({ displayText: x.description, value: x.value }) as RadioButton);

    this.reviewProcedureChoices = enumUtil
      .getArrayWithDescriptions<MajorityElectionReviewProcedure>(
        MajorityElectionReviewProcedure,
        'MAJORITY_ELECTION.RESULT_ENTRY.REVIEW_PROCEDURE.TYPES.',
      )
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));

    this.routeSubscription = route.data.subscribe(async ({ contestCantonDefaults }) => {
      this.useCandidateCheckDigit = contestCantonDefaults.majorityElectionUseCandidateCheckDigit;
    });
  }

  public ngOnInit(): void {
    this.isInitialSetup = this.resultEntry === MajorityElectionResultEntry.MAJORITY_ELECTION_RESULT_ENTRY_UNSPECIFIED;
    if (this.isInitialSetup) {
      this.resultEntry = this.election.resultEntry;
    }

    this.resultEntryParams = { ...this.resultEntryParams };

    if (this.isInitialSetup || !this.resultEntryParams) {
      const {
        ballotBundleSize,
        ballotBundleSampleSize,
        automaticEmptyVoteCounting,
        automaticBallotBundleNumberGeneration,
        ballotNumberGeneration,
        reviewProcedure,
        candidateCheckDigit,
      } = this.election;
      this.resultEntryParams = {
        ballotBundleSize,
        ballotBundleSampleSize,
        automaticEmptyVoteCounting,
        automaticBallotBundleNumberGeneration,
        ballotNumberGeneration,
        reviewProcedure,
        candidateCheckDigit,
      };
    }

    this.originalResultEntry = this.resultEntry;
    this.originalResultEntryParams = { ...this.resultEntryParams };
    for (const variant of this.resultEntryVariants) {
      variant.disabled = this.election.enforceResultEntryForCountingCircles;
    }
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
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
      await this.resultService.defineEntry(this.electionResultId, this.resultEntry, this.resultEntryParams);
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
