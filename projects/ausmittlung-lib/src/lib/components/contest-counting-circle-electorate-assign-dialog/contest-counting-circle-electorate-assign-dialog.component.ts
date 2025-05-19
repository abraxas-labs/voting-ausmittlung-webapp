/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { EnumUtil } from '@abraxas/voting-lib';
import { DomainOfInfluenceType } from '../../models';
import { TableDataSource } from '@abraxas/base-components';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-contest-counting-circle-electorate-assign-dialog',
  templateUrl: './contest-counting-circle-electorate-assign-dialog.component.html',
  styleUrls: ['./contest-counting-circle-electorate-assign-dialog.component.scss'],
  standalone: false,
})
export class ContestCountingCircleElectorateAssignDialogComponent {
  public readonly columns = ['select', 'domainOfInfluenceType'];
  public readonly columnsSelected = ['domainOfInfluenceType'];

  public dataSource = new TableDataSource<DomainOfInfluenceType>();
  public selection = new SelectionModel<DomainOfInfluenceType>(true, []);
  public isAllSelected: boolean = false;

  constructor(
    private readonly dialogRef: MatDialogRef<ContestCountingCircleElectorateAssignDialogData>,
    @Inject(MAT_DIALOG_DATA) dialogData: ContestCountingCircleElectorateAssignDialogData,
  ) {
    this.dataSource.data = EnumUtil.getArray<DomainOfInfluenceType>(DomainOfInfluenceType)
      .map(i => i.value)
      .filter(t => !dialogData.disabledDomainOfInfluenceTypes.includes(t));

    const selected = this.dataSource.data.filter(x => dialogData.assignedDomainOfInfluenceTypes.includes(x));
    this.selection.select(...selected);
  }

  public close(): void {
    this.dialogRef.close();
  }

  public save(): void {
    const selected = this.selection.selected;
    selected.sort((a, b) => a - b); // ascending sort by domain of influence type.

    const result: ContestCountingCircleElectorateAssignDialogResult = {
      assignedDomainOfInfluenceTypes: this.selection.selected,
    };
    this.dialogRef.close(result);
  }

  public toggleAllRows(value: boolean) {
    if (value === this.isAllSelected) {
      return;
    }

    value ? this.selection.select(...this.dataSource.data) : this.selection.clear();
    this.updateIsAllSelected();
  }

  public toggleRow(row: DomainOfInfluenceType, value: boolean): void {
    if (value === this.selection.isSelected(row)) {
      return;
    }

    this.selection.toggle(row);
    this.updateIsAllSelected();
  }

  public updateIsAllSelected(): void {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    this.isAllSelected = numSelected === numRows;
  }
}

export interface ContestCountingCircleElectorateAssignDialogData {
  assignedDomainOfInfluenceTypes: DomainOfInfluenceType[];
  disabledDomainOfInfluenceTypes: DomainOfInfluenceType[];
}

export interface ContestCountingCircleElectorateAssignDialogResult {
  assignedDomainOfInfluenceTypes: DomainOfInfluenceType[];
}
