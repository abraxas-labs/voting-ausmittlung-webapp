/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DoubleProportionalResult,
  ProportionalElectionUnionList,
  ProportionalElectionList,
  DoubleProportionalResultApportionmentState,
} from 'ausmittlung-lib';

const additionalGridRows = 3; // header + sum of union lists + union list divisor row

@Component({
  selector: 'app-double-proportional-result-sub-apportionment',
  templateUrl: './double-proportional-result-sub-apportionment.component.html',
  styleUrls: ['./double-proportional-result-sub-apportionment.component.scss'],
  standalone: false,
})
export class DoubleProportionalResultSubApportionmentComponent {
  public readonly dpResultApportionmentState: typeof DoubleProportionalResultApportionmentState =
    DoubleProportionalResultApportionmentState;

  public gridTemplateRowsStyle: string = '';
  public extColumns: ColData[] = [];
  public displayVoteCount: boolean = false;

  private doubleProportionalResultValue?: DoubleProportionalResult;

  public get doubleProportionalResult(): DoubleProportionalResult | undefined {
    return this.doubleProportionalResultValue;
  }

  @Input()
  public set doubleProportionalResult(v: DoubleProportionalResult | undefined) {
    if (v === this.doubleProportionalResult) {
      return;
    }

    this.doubleProportionalResultValue = v;

    if (!v) {
      return;
    }

    this.refreshTable();
  }

  @Output()
  public update: EventEmitter<void> = new EventEmitter<void>();

  public handleLotDecisionUpdate(): void {
    this.update.emit();
    this.refreshTable();
  }

  public refreshTable(): void {
    if (!this.doubleProportionalResult) {
      return;
    }

    this.gridTemplateRowsStyle = `repeat(${this.doubleProportionalResult.rows.length + additionalGridRows}, min-content)`;
    this.extColumns = this.doubleProportionalResult.columns
      .filter(col => col.anyRequiredQuorumReached)
      .map(col => ({
        unionList: col.unionList,
        list: col.list,
        subApportionmentNumberOfMandates: col.subApportionmentNumberOfMandates,
        cellData: this.doubleProportionalResult!.rows.map(row => {
          const t = row.cells.find(
            cell =>
              cell.list.orderNumber === (col.unionList?.orderNumber ?? col.list!.orderNumber) &&
              cell.list.shortDescription === (col.unionList?.shortDescription ?? col.list!.shortDescription),
          );
          return !!t ? { numberOfMandates: t.subApportionmentNumberOfMandates, voteCount: t.voteCount } : undefined;
        }),
        divisor: col.divisor,
      }));
  }
}

interface ColData {
  unionList?: ProportionalElectionUnionList;
  list?: ProportionalElectionList;
  subApportionmentNumberOfMandates: number;
  cellData: ({ numberOfMandates: number; voteCount: number } | undefined)[];
  divisor: number;
}
