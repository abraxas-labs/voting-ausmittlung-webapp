/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { TranslateService } from '@ngx-translate/core';
import {
  ProportionalElectionEndResultAvailableLotDecision,
  ProportionalElectionEndResultLotDecision,
  ProportionalElectionListEndResult,
  ProportionalElectionListEndResultAvailableLotDecisions,
  ProportionalElectionResultService,
} from 'ausmittlung-lib';
import { ElectionLotDecisionDialogComponent } from '../election-lot-decision-dialog/election-lot-decision-dialog.component';

@Component({
  selector: 'app-proportional-election-lot-decision-dialog',
  templateUrl: './proportional-election-lot-decision-dialog.component.html',
  styleUrls: ['./proportional-election-lot-decision-dialog.component.scss'],
})
export class ProportionalElectionLotDecisionDialogComponent extends ElectionLotDecisionDialogComponent {
  @ViewChild(MatStepper, { static: true })
  public stepper!: MatStepper;

  public loading: boolean = false;
  public isLast: boolean = false;
  public hasAnyOpenRequiredLotDecisions: boolean = true;
  public availableLotDecisions?: ProportionalElectionListEndResultAvailableLotDecisions;
  public lists: ProportionalElectionListEndResult[];
  public readonly lotDecisionsByListId: Record<string, ProportionalElectionEndResultLotDecision[]> = {};

  private selectedList?: ProportionalElectionListEndResult;

  constructor(
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly dialogRef: MatDialogRef<ProportionalElectionLotDecisionDialogData>,
    private readonly resultService: ProportionalElectionResultService,
    @Inject(MAT_DIALOG_DATA) dialogData: ProportionalElectionLotDecisionDialogData,
    dialog: DialogService,
  ) {
    super(dialog);

    this.lists = this.sortLists(dialogData.lists);

    this.selectionChanged(0);
  }

  public selectionChanged(index: number): void {
    this.isLast = index === this.lists.length - 1;
    this.selectedList = this.lists[index];
    this.loadData();
  }

  public async save(): Promise<void> {
    if (this.selectedList === undefined || !this.ensureHasValidLotDecisions()) {
      return;
    }

    const availableLotDecisionsWithSelectedRank = this.getAvailableLotDecisionsWithSelectedRank();
    if (availableLotDecisionsWithSelectedRank.length === 0) {
      this.nextOrClose();
      return;
    }

    const lotDecisions: ProportionalElectionEndResultLotDecision[] = availableLotDecisionsWithSelectedRank.map(x => ({
      candidateId: x.candidate.id,
      rank: x.selectedRank!,
    }));

    this.loading = true;
    try {
      await this.resultService.updateListEndResultLotDecisions(this.selectedList.list.id, lotDecisions);
      this.selectedList.hasOpenRequiredLotDecisions = false;
      this.lotDecisionsByListId[this.selectedList.list.id] = lotDecisions;
      this.toast.success(this.i18n.instant('APP.SAVED'));
    } finally {
      this.loading = false;
    }

    this.nextOrClose();
  }

  public close(): void {
    const result: ProportionalElectionLotDecisionDialogResult = {
      lotDecisionsByListId: this.lotDecisionsByListId,
    };
    this.dialogRef.close(result);
  }

  public updateHasOpenRequiredLotDecisions(): void {
    this.hasAnyOpenRequiredLotDecisions =
      this.availableLotDecisions !== undefined && this.hasOpenRequiredLotDecisions(this.availableLotDecisions.lotDecisions);
  }

  private getAvailableLotDecisionsWithSelectedRank(): ProportionalElectionEndResultAvailableLotDecision[] {
    if (!this.availableLotDecisions) {
      return [];
    }

    return this.availableLotDecisions.lotDecisions.filter(
      lotDecision => lotDecision.selectedRank !== undefined && lotDecision.selectedRank > 0,
    );
  }

  private nextOrClose(): void {
    if (!this.isLast) {
      this.stepper.selectedIndex = this.stepper.selectedIndex + 1;
      return;
    }

    this.close();
  }

  private ensureHasValidLotDecisions(): boolean {
    if (!this.availableLotDecisions) {
      return false;
    }

    if (this.hasOpenRequiredLotDecisions(this.availableLotDecisions.lotDecisions)) {
      this.alertMissingRequiredLotDecisions();
      return false;
    }

    if (!this.hasUniqueLotDecisions(this.availableLotDecisions.lotDecisions)) {
      this.alertDuplicateLotDecisions();
      return false;
    }

    return true;
  }

  private async loadData(): Promise<void> {
    delete this.availableLotDecisions;

    if (this.selectedList === undefined) {
      this.updateHasOpenRequiredLotDecisions();
      return;
    }

    try {
      this.loading = true;
      this.availableLotDecisions = await this.resultService.getListEndResultAvailableLotDecisions(this.selectedList.list.id);
      this.updateHasOpenRequiredLotDecisions();
    } finally {
      this.loading = false;
    }
  }

  private sortLists(lists: ProportionalElectionListEndResult[]): ProportionalElectionListEndResult[] {
    // .sort() sorts in place, so we need to make a copy first
    const copy = [...lists];
    return copy.sort((a, b) => {
      if (a.hasOpenRequiredLotDecisions === b.hasOpenRequiredLotDecisions) {
        return b.list.shortDescription.localeCompare(a.list.shortDescription);
      }

      // first required lot decisions, then others
      return a.hasOpenRequiredLotDecisions ? -1 : 1;
    });
  }
}

export interface ProportionalElectionLotDecisionDialogData {
  lists: ProportionalElectionListEndResult[];
}

export interface ProportionalElectionLotDecisionDialogResult {
  lotDecisionsByListId: Record<string, ProportionalElectionEndResultLotDecision[]>;
}
