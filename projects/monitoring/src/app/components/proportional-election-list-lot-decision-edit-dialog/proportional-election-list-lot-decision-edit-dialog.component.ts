/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProportionalElectionManualEndResultDialogData } from '../proportional-election-manual-end-result-dialog/proportional-election-manual-end-result-dialog.component';
import {
  distinct,
  ProportionalElectionEndResultListLotDecision,
  ProportionalElectionEndResultListLotDecisionEntry,
  ProportionalElectionList,
  ProportionalElectionListEndResult,
  ProportionalElectionListUnion,
} from 'ausmittlung-lib';

@Component({
  selector: 'app-proportional-election-list-lot-decision-edit-dialog',
  templateUrl: './proportional-election-list-lot-decision-edit-dialog.component.html',
  styleUrls: ['./proportional-election-list-lot-decision-edit-dialog.component.scss'],
})
export class ProportionalElectionListLotDecisionEditDialogComponent {
  public readonly columns = ['description', 'winner'];
  public lotDecisionEntries: ProportionalElectionEndResultListLotDecisionEntry[] = [];

  public listEndResults: ProportionalElectionListEndResult[];
  public lists: ProportionalElectionList[];
  public selectedLists: ProportionalElectionList[] = [];
  public listUnions: ProportionalElectionListUnion[];
  public selectedListUnions: ProportionalElectionListUnion[] = [];
  public loading: boolean = false;

  constructor(
    private readonly dialogRef: MatDialogRef<ProportionalElectionManualEndResultDialogData>,
    @Inject(MAT_DIALOG_DATA) dialogData: ProportionalElectionListLotDecisionEditDialogData,
  ) {
    this.listEndResults = dialogData.lists;
    this.lists = this.listEndResults.map(x => x.list);
    const listUnions = distinct(
      this.listEndResults.filter(x => !!x.listUnion).map(x => x.listUnion!),
      x => x.id,
    );
    const listSubUnions = distinct(
      this.listEndResults.filter(x => !!x.subListUnion).map(x => x.subListUnion!),
      x => x.id,
    );
    this.listUnions = listUnions.concat(listSubUnions);
  }

  public async save(): Promise<void> {
    const result = { lotDecision: { entries: this.lotDecisionEntries } } as ProportionalElectionListLotDecisionEditDialogResult;
    this.dialogRef.close(result);
  }

  public close(): void {
    this.dialogRef.close();
  }

  public updateLotDecisionEntries(): void {
    this.lotDecisionEntries = this.selectedLists
      .map(
        x =>
          ({
            description: x.shortDescription,
            winning: false,
            listId: x.id,
          }) as ProportionalElectionEndResultListLotDecisionEntry,
      )
      .concat(
        this.selectedListUnions.map(
          x =>
            ({
              description: x.description,
              winning: false,
              listUnionId: x.id,
            }) as ProportionalElectionEndResultListLotDecisionEntry,
        ),
      );
  }

  public get canSave(): boolean {
    return this.lotDecisionEntries.length > 1 && this.lotDecisionEntries.some(x => x.winning);
  }
}

export interface ProportionalElectionListLotDecisionEditDialogData {
  lists: ProportionalElectionListEndResult[];
}

export interface ProportionalElectionListLotDecisionEditDialogResult {
  lotDecision: ProportionalElectionEndResultListLotDecision;
}
