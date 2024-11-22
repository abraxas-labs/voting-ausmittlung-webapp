/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProportionalElectionManualEndResultDialogData } from '../proportional-election-manual-end-result-dialog/proportional-election-manual-end-result-dialog.component';
import {
  ProportionalElectionEndResultListLotDecision,
  ProportionalElectionListEndResult,
  ProportionalElectionResultService,
} from 'ausmittlung-lib';
import { TableDataSource } from '@abraxas/base-components';
import {
  ProportionalElectionListLotDecisionEditDialogComponent,
  ProportionalElectionListLotDecisionEditDialogData,
  ProportionalElectionListLotDecisionEditDialogResult,
} from '../proportional-election-list-lot-decision-edit-dialog/proportional-election-list-lot-decision-edit-dialog.component';

@Component({
  selector: 'app-proportional-election-add-lot-decision-dialog',
  templateUrl: './proportional-election-list-lot-decisions-dialog.component.html',
})
export class ProportionalElectionListLotDecisionsDialogComponent {
  public readonly columns = ['lists', 'winners', 'actions'];

  public loading: boolean = false;
  public proportionalElectionId: string;
  public lists: ProportionalElectionListEndResult[];
  public listLotDecisions: ProportionalElectionEndResultListLotDecision[];
  public dataSource = new TableDataSource<ListLotDecisionType>();

  constructor(
    private readonly dialogRef: MatDialogRef<ProportionalElectionManualEndResultDialogData>,
    private readonly resultService: ProportionalElectionResultService,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
    private readonly dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) dialogData: ProportionalElectionListLotDecisionsDialogData,
  ) {
    this.proportionalElectionId = dialogData.proportionalElectionId;
    this.lists = dialogData.lists;
    this.listLotDecisions = dialogData.listLotDecisions;
    this.updateListLotDecisionTypes();
  }

  public async save(): Promise<void> {
    this.loading = true;
    try {
      await this.resultService.updateEndResultListLotDecisions(this.proportionalElectionId, this.listLotDecisions);
      this.toast.success(this.i18n.instant('APP.SAVED'));
    } finally {
      this.loading = false;
    }

    this.close();
  }

  public async addListLotDecision(): Promise<void> {
    const data: ProportionalElectionListLotDecisionEditDialogData = {
      lists: this.lists,
    };

    const result = await this.dialogService.openForResult<
      ProportionalElectionListLotDecisionEditDialogComponent,
      ProportionalElectionListLotDecisionEditDialogResult
    >(ProportionalElectionListLotDecisionEditDialogComponent, data);

    if (result) {
      this.listLotDecisions.push(result.lotDecision);
      this.updateListLotDecisionTypes();
    }
  }

  public removeListLotDecision(listLotDecisionType: ListLotDecisionType): void {
    this.listLotDecisions = this.listLotDecisions.filter(x => x !== listLotDecisionType.listLotDecision);
    this.dataSource.data = this.dataSource.data.filter(x => x !== listLotDecisionType);
  }

  public close(): void {
    this.dialogRef.close();
  }

  private updateListLotDecisionTypes(): void {
    this.dataSource.data = this.listLotDecisions.map(x => ({
      lists: x.entries.map(y => y.description).join(', '),
      winners: x.entries
        .filter(y => y.winning)
        .map(y => y.description)
        .join(', '),
      listLotDecision: x,
    }));
  }
}

export interface ProportionalElectionListLotDecisionsDialogData {
  proportionalElectionId: string;
  lists: ProportionalElectionListEndResult[];
  listLotDecisions: ProportionalElectionEndResultListLotDecision[];
}

export type ListLotDecisionType = {
  lists: string;
  winners: string;
  listLotDecision: ProportionalElectionEndResultListLotDecision;
};
