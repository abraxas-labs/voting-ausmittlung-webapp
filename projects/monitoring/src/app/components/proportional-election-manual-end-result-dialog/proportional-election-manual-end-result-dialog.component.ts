/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { EnumItemDescription, EnumUtil, SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { TranslateService } from '@ngx-translate/core';
import { ProportionalElectionListEndResult, ProportionalElectionResultService } from 'ausmittlung-lib';
import {
  ProportionalElectionCandidateEndResultState,
  ProportionalElectionManualCandidateEndResult,
} from '../../../../../ausmittlung-lib/src/public-api';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-proportional-election-manual-end-result-dialog',
  templateUrl: './proportional-election-manual-end-result-dialog.component.html',
  styleUrls: ['./proportional-election-manual-end-result-dialog.component.scss'],
})
export class ProportionalElectionManualEndResultDialogComponent {
  @ViewChild(MatStepper, { static: true })
  public stepper!: MatStepper;

  public loading: boolean = false;
  public isLast: boolean = false;
  public lists: ProportionalElectionListEndResult[];
  public canSave: boolean = false;
  public readonly candidateStates: EnumItemDescription<ProportionalElectionCandidateEndResultState>[] = [];

  private selectedList?: ProportionalElectionListEndResult;
  private hasChanges: boolean = false;
  public manualCandidateEndResults?: ProportionalElectionManualCandidateEndResult[];
  public hasAnyOpenRequiredCandidateStates: boolean = true;

  constructor(
    enumUtil: EnumUtil,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly dialogRef: MatDialogRef<ProportionalElectionManualEndResultDialogData>,
    private readonly resultService: ProportionalElectionResultService,
    @Inject(MAT_DIALOG_DATA) dialogData: ProportionalElectionManualEndResultDialogData,
  ) {
    this.lists = dialogData.lists;
    this.candidateStates = enumUtil
      .getArrayWithDescriptions<ProportionalElectionCandidateEndResultState>(
        ProportionalElectionCandidateEndResultState,
        'PROPORTIONAL_ELECTION.CANDIDATE.STATES.',
      )
      .filter(
        x =>
          x.value === ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_NOT_ELECTED ||
          x.value === ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_ELECTED,
      );
    this.selectionChanged(0);
  }

  public selectionChanged(index: number): void {
    this.isLast = index === this.lists.length - 1;
    this.selectedList = this.lists[index];

    if (this.selectedList === undefined) {
      return;
    }

    this.manualCandidateEndResults = this.selectedList.candidateEndResults.map(x => ({
      candidate: x.candidate,
      rank: x.rank,
      voteCount: x.voteCount,
      state: x.state,
    }));

    this.updateHasOpenRequiredCandidateStates();
  }

  public async save(): Promise<void> {
    if (this.selectedList === undefined || !this.manualCandidateEndResults || !this.ensureListHasValidStates()) {
      return;
    }

    this.loading = true;
    try {
      await this.resultService.enterManualListEndResult(this.selectedList.list.id, this.manualCandidateEndResults);
      this.toast.success(this.i18n.instant('APP.SAVED'));
      this.hasChanges = true;
    } finally {
      this.loading = false;
    }

    this.nextOrClose();
  }

  public updateHasOpenRequiredCandidateStates(): void {
    this.hasAnyOpenRequiredCandidateStates =
      this.manualCandidateEndResults !== undefined && !!this.manualCandidateEndResults.find(x => !this.isValidState(x.state));
  }

  public close(): void {
    const result: ProportionalElectionManualEndResultDialogResult = {
      hasChanges: this.hasChanges,
    };

    this.dialogRef.close(result);
  }

  private nextOrClose(): void {
    if (!this.isLast) {
      this.stepper.selectedIndex = this.stepper.selectedIndex + 1;
      return;
    }

    this.close();
  }

  private ensureListHasValidStates(): boolean {
    if (!this.selectedList || !this.manualCandidateEndResults) {
      return false;
    }

    const hasInvalidState = this.manualCandidateEndResults.find(
      x =>
        x.state !== ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_NOT_ELECTED &&
        x.state !== ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_ELECTED,
    );

    return !hasInvalidState;
  }

  private isValidState(state: ProportionalElectionCandidateEndResultState) {
    return (
      state === ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_NOT_ELECTED ||
      state === ProportionalElectionCandidateEndResultState.PROPORTIONAL_ELECTION_CANDIDATE_END_RESULT_STATE_ELECTED
    );
  }
}

export interface ProportionalElectionManualEndResultDialogData {
  lists: ProportionalElectionListEndResult[];
}

export interface ProportionalElectionManualEndResultDialogResult {
  hasChanges: boolean;
}
