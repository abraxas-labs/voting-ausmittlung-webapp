/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  flatten,
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
  standalone: false,
})
export class MajorityElectionLotDecisionDialogComponent extends ElectionLotDecisionDialogComponent {
  public loading: boolean = false;
  public availableLotDecisions?: MajorityElectionEndResultAvailableLotDecisions;
  public majorityElectionId: string = '';
  public hasPrimaryAndSecondaryLotDecisions = false;
  public selectedStepIndex = 0;
  public steps: MajorityElectionLotDecisionStep[] = [];
  public hasChanges = false;
  public canEditStepSecondaryLotDecisions = false;

  public originalAvailableLotDecisions?: MajorityElectionEndResultAvailableLotDecisions;

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

  public async selectedStepChange(index: number): Promise<void> {
    const hasChanges = this.hasChanges;

    await this.save(
      this.selectedStepIndex === 0
        ? MajorityElectionLotDecisionSaveType.PRIMARY_ELECTION
        : MajorityElectionLotDecisionSaveType.SECONDARY_ELECTION,
    );

    if (index === 2 && !hasChanges) {
      if (!hasChanges) {
        this.dialogRef.close();
      }
      return;
    }

    this.selectedStepIndex = index;
  }

  public async singleStepSave(): Promise<void> {
    if (!!this.availableLotDecisions && this.availableLotDecisions.lotDecisions.length > 0) {
      await this.save(MajorityElectionLotDecisionSaveType.PRIMARY_ELECTION);
    } else {
      await this.save(MajorityElectionLotDecisionSaveType.SECONDARY_ELECTION);
    }

    this.dialogRef.close();
  }

  public async save(saveType: MajorityElectionLotDecisionSaveType): Promise<void> {
    if (!this.availableLotDecisions || !this.hasChanges) {
      return;
    }

    const isPrimaryUpdate = saveType === MajorityElectionLotDecisionSaveType.PRIMARY_ELECTION;

    const availableLotDecisions = isPrimaryUpdate
      ? this.availableLotDecisions.lotDecisions
      : flatten(this.availableLotDecisions.secondaryLotDecisions.map(d => d.lotDecisions));

    if (!this.ensureHasValidLotDecisions(availableLotDecisions)) {
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
      if (isPrimaryUpdate) {
        await this.resultService.updateEndResultLotDecisions(this.majorityElectionId, lotDecisions);
      } else {
        await this.resultService.updateEndResultSecondaryLotDecisions(this.majorityElectionId, lotDecisions);
      }

      this.toast.success(this.i18n.instant('APP.SAVED'));
      this.hasChanges = false;

      const result: MajorityElectionLotDecisionDialogResult = {
        success: true,
      };
      this.dialogRef.close(result);
    } finally {
      this.loading = false;
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  private ensureHasValidLotDecisions(lotDecisions: MajorityElectionEndResultAvailableLotDecision[]): boolean {
    if (!lotDecisions || lotDecisions.length === 0) {
      return false;
    }

    if (!this.hasValidVoteCountGroups(lotDecisions)) {
      this.alertVoteCountGroupConflict();
      return false;
    }

    if (!this.hasUniqueLotDecisions(lotDecisions)) {
      this.alertDuplicateLotDecisions();
      return false;
    }

    return true;
  }

  private async loadData(): Promise<void> {
    this.availableLotDecisions = await this.resultService.getEndResultAvailableLotDecisions(this.majorityElectionId);

    this.hasPrimaryAndSecondaryLotDecisions =
      this.availableLotDecisions!.lotDecisions.length > 0 &&
      flatten(this.availableLotDecisions.secondaryLotDecisions.map(x => x.lotDecisions)).length > 0;

    this.canEditStepSecondaryLotDecisions =
      this.hasPrimaryAndSecondaryLotDecisions &&
      this.availableLotDecisions.lotDecisions.every(l => !l.lotDecisionRequired || !!l.selectedRank);

    this.updateSteps();
  }

  private updateSteps(): void {
    if (!this.availableLotDecisions) {
      return;
    }

    if (!this.hasPrimaryAndSecondaryLotDecisions) {
      this.steps = [];
      return;
    }

    this.steps = [
      {
        label: 'MAJORITY_ELECTION_END_RESULT.LOT_DECISION.PRIMARY_ELECTION',
      },
      {
        label: 'MAJORITY_ELECTION_END_RESULT.LOT_DECISION.SECONDARY_ELECTION',
      },
    ];
  }
}

interface MajorityElectionLotDecisionStep {
  label: string;
}

enum MajorityElectionLotDecisionSaveType {
  PRIMARY_ELECTION,
  SECONDARY_ELECTION,
}

export interface MajorityElectionLotDecisionDialogData {
  majorityElectionId: string;
}

export interface MajorityElectionLotDecisionDialogResult {
  success: boolean;
}
