/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RadioButton } from '@abraxas/base-components';
import { ProportionalElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/proportional_election_pb';
import { EnumUtil } from '@abraxas/voting-lib';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { isEqual } from 'lodash';
import { ProportionalElection, ProportionalElectionResultEntryParams } from '../../../../models';
import { ProportionalElectionResultService } from '../../../../services/proportional-election-result.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'vo-ausm-contest-proportional-election-detail-result-entry',
  templateUrl: './contest-proportional-election-detail-result-entry.component.html',
  standalone: false,
})
export class ContestProportionalElectionDetailResultEntryComponent implements OnInit, OnDestroy {
  @Input()
  public readonly: boolean = true;

  @Input()
  public electionResultId: string = '';

  @Input()
  public election!: ProportionalElection;

  @Input()
  public resultEntryParams!: ProportionalElectionResultEntryParams;

  @Output()
  public resultEntryParamsChange: EventEmitter<ProportionalElectionResultEntryParams> =
    new EventEmitter<ProportionalElectionResultEntryParams>();

  @Output()
  public done: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public resetResults: EventEmitter<void> = new EventEmitter<void>();

  public confirmationRequested: boolean = false;
  public isUpdatingResultEntryParams: boolean = false;

  public isInitialSetup: boolean = true;
  public reviewProcedureChoices: RadioButton[];
  private originalResultEntryParams!: ProportionalElectionResultEntryParams;
  public useCandidateCheckDigit: boolean = false;
  private readonly routeSubscription: Subscription;

  constructor(
    private readonly resultService: ProportionalElectionResultService,
    enumUtil: EnumUtil,
    route: ActivatedRoute,
  ) {
    this.reviewProcedureChoices = enumUtil
      .getArrayWithDescriptions<ProportionalElectionReviewProcedure>(
        ProportionalElectionReviewProcedure,
        'PROPORTIONAL_ELECTION.RESULT_ENTRY.REVIEW_PROCEDURE.TYPES.',
      )
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));

    this.routeSubscription = route.data.subscribe(async ({ contestCantonDefaults }) => {
      this.useCandidateCheckDigit = contestCantonDefaults.proportionalElectionUseCandidateCheckDigit;
    });
  }

  public ngOnInit(): void {
    this.isInitialSetup = !this.resultEntryParams.ballotBundleSize;
    if (this.isInitialSetup) {
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
    this.resultEntryParams = { ...this.resultEntryParams };
    this.originalResultEntryParams = { ...this.resultEntryParams };
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  public async save(): Promise<void> {
    if (!this.isInitialSetup && isEqual(this.resultEntryParams, this.originalResultEntryParams)) {
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
    this.resultEntryParams = { ...this.originalResultEntryParams };

    if (done) {
      this.done.emit();
    }
  }

  private async updateResultEntry(): Promise<void> {
    try {
      this.isUpdatingResultEntryParams = true;
      await this.resultService.defineEntry(this.electionResultId, this.resultEntryParams);
      this.originalResultEntryParams = { ...this.resultEntryParams };
      this.resultEntryParamsChange.emit(this.resultEntryParams);
      this.resetResults.emit();
      this.done.emit();
    } finally {
      this.isUpdatingResultEntryParams = false;
    }
  }
}
