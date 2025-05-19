/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableDataSource } from '@abraxas/base-components';
import { SelectionModel } from '@angular/cdk/collections';
import { ProportionalElectionListUnion } from 'ausmittlung-lib';

@Component({
  selector: 'app-proportional-election-list-lot-decision-edit-list-unions-table',
  templateUrl: './proportional-election-list-lot-decision-edit-list-unions-table.component.html',
  styleUrls: ['proportional-election-list-lot-decision-edit-list-unions-table.component.scss'],
  standalone: false,
})
export class ProportionalElectionListLotDecisionEditListUnionsTableComponent {
  public readonly columns = ['select', 'description'];

  public dataSource = new TableDataSource<ProportionalElectionListUnion>();
  public selection = new SelectionModel<ProportionalElectionListUnion>(true, []);
  public isAllSelected: boolean = false;

  @Input()
  public set listUnions(listUnions: ProportionalElectionListUnion[]) {
    this.dataSource.data = listUnions;
  }

  @Output()
  public selectedChanged: EventEmitter<ProportionalElectionListUnion[]> = new EventEmitter<ProportionalElectionListUnion[]>();

  public toggleAllRows(value: boolean) {
    if (value === this.isAllSelected) {
      return;
    }

    value ? this.selection.select(...this.dataSource.data) : this.selection.clear();
    this.updateIsAllSelected();
  }

  public toggleRow(row: ProportionalElectionListUnion, value: boolean): void {
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
