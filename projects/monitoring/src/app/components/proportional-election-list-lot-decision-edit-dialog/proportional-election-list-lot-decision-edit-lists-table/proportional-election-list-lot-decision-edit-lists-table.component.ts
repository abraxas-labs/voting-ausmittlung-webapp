/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableDataSource } from '@abraxas/base-components';
import { SelectionModel } from '@angular/cdk/collections';
import { ProportionalElectionList } from 'ausmittlung-lib';

@Component({
  selector: 'app-proportional-election-list-lot-decision-edit-lists-table',
  templateUrl: './proportional-election-list-lot-decision-edit-lists-table.component.html',
  styleUrls: ['proportional-election-list-lot-decision-edit-lists-table.component.scss'],
})
export class ProportionalElectionListLotDecisionEditListsTableComponent {
  public readonly columns = ['select', 'shortDescription'];

  public dataSource = new TableDataSource<ProportionalElectionList>();
  public selection = new SelectionModel<ProportionalElectionList>(true, []);
  public isAllSelected: boolean = false;

  @Input()
  public set lists(lists: ProportionalElectionList[]) {
    this.dataSource.data = lists;
  }

  @Output()
  public selectedChanged: EventEmitter<ProportionalElectionList[]> = new EventEmitter<ProportionalElectionList[]>();

  public toggleAllRows(value: boolean) {
    if (value === this.isAllSelected) {
      return;
    }

    value ? this.selection.select(...this.dataSource.data) : this.selection.clear();
    this.updateIsAllSelected();
  }

  public toggleRow(row: ProportionalElectionList, value: boolean): void {
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
