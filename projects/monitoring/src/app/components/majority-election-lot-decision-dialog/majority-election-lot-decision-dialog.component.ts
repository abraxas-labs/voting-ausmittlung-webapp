/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  MajorityElectionEndResultAvailableLotDecision,
  MajorityElectionEndResultAvailableLotDecisions,
  MajorityElectionEndResultLotDecision,
  MajorityElectionResultService,
} from 'ausmittlung-lib';
import { ElectionLotDecisionDialogComponent } from '../election-lot-decision-dialog/election-lot-decision-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-majority-election-lot-decision-dialog',
  templateUrl: './majority-election-lot-decision-dialog.component.html',
})
export class MajorityElectionLotDecisionDialogComponent extends ElectionLotDecisionDialogComponent {
  public loading: boolean = false;
  public availableLotDecisions?: MajorityElectionEndResultAvailableLotDecisions;
  public majorityElectionId: string = '';

  constructor(
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly dialogRef: MatDialogRef<MajorityElectionLotDecisionDialogData>,
    private readonly resultService: MajorityElectionResultService,
    @Inject(MAT_DIALOG_DATA) dialogData: MajorityElectionLotDecisionDialogData,
    dialog: DialogService,
  ) {
    super(dialog);
    this.majorityElectionId = dialogData.majorityElectionId;
    this.loadData();
  }

  public async save(): Promise<void> {
    if (!this.ensureHasValidLotDecisions()) {
      return;
    }

    const availableLotDecisions = this.getAvailableLotDecisions();
    if (availableLotDecisions.length === 0) {
      return;
    }

    const lotDecisions: MajorityElectionEndResultLotDecision[] = availableLotDecisions.map(x => {
      return {
        candidateId: x.candidate.id,
        rank: x.selectedRank,
      };
    });

    this.loading = true;
    try {
      await this.resultService.updateEndResultLotDecisions(this.majorityElectionId, lotDecisions);
      this.toast.success(this.i18n.instant('APP.SAVED'));
    } finally {
      this.loading = false;
    }

    const result: MajorityElectionLotDecisionDialogResult = {
      lotDecisions,
    };
    this.dialogRef.close(result);
  }

  public close(): void {
    this.dialogRef.close();
  }

  private getAvailableLotDecisions(): MajorityElectionEndResultAvailableLotDecision[] {
    if (!this.availableLotDecisions) {
      return [];
    }

    const lotDecisions = this.availableLotDecisions.lotDecisions;

    if (!this.availableLotDecisions.secondaryLotDecisions) {
      return lotDecisions;
    }

    for (const secondaryLotDecisions of this.availableLotDecisions.secondaryLotDecisions) {
      lotDecisions.push(...secondaryLotDecisions.lotDecisions);
    }
    return lotDecisions;
  }

  private ensureHasValidLotDecisions(): boolean {
    if (!this.availableLotDecisions) {
      return false;
    }

    if (!this.hasValidVoteCountGroups(this.availableLotDecisions.lotDecisions)) {
      this.alertVoteCountGroupConflict();
      return false;
    }

    if (!this.hasUniqueLotDecisions(this.availableLotDecisions.lotDecisions)) {
      this.alertDuplicateLotDecisions();
      return false;
    }

    for (const secondaryLotDecisions of this.availableLotDecisions.secondaryLotDecisions) {
      if (!this.hasValidVoteCountGroups(secondaryLotDecisions.lotDecisions)) {
        this.alertVoteCountGroupConflict();
        return false;
      }
      if (!this.hasUniqueLotDecisions(secondaryLotDecisions.lotDecisions)) {
        this.alertDuplicateLotDecisions();
        return false;
      }
    }
    return true;
  }

  private async loadData(): Promise<void> {
    this.availableLotDecisions = await this.resultService.getEndResultAvailableLotDecisions(this.majorityElectionId);
  }
}

export interface MajorityElectionLotDecisionDialogData {
  majorityElectionId: string;
}

export interface MajorityElectionLotDecisionDialogResult {
  lotDecisions: MajorityElectionEndResultLotDecision[];
}
