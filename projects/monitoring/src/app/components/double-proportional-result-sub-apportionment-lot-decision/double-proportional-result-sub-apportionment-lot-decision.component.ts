/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SelectionDirective } from '@abraxas/base-components';
import { SnackbarService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  DoubleProportionalResult,
  DoubleProportionalResultApportionmentState,
  DoubleProportionalResultSubApportionmentLotDecision,
  DoubleProportionalResultSubApportionmentLotDecisionCell,
  ProportionalElectionUnionResultService,
  flatten,
  sum,
} from 'ausmittlung-lib';

@Component({
  selector: 'app-double-proportional-result-sub-apportionment-lot-decision',
  templateUrl: './double-proportional-result-sub-apportionment-lot-decision.component.html',
  styleUrl: './double-proportional-result-sub-apportionment-lot-decision.component.scss',
  standalone: false,
})
export class DoubleProportionalResultSubApportionmentLotDecisionComponent implements OnInit {
  private readonly defaultColumns = ['lot'];

  public columns: string[] = [];
  public lotDecisionColumnDefs: string[] = [];
  public newLotDecisionSelected = false;
  public selectedLotDecision?: DoubleProportionalResultSubApportionmentLotDecision;
  public lotDecisions: DoubleProportionalResultSubApportionmentLotDecision[] = [];

  public initialLoading = true;
  public saving = false;

  constructor(
    private readonly proportionalElectionUnionResultService: ProportionalElectionUnionResultService,
    private readonly cd: ChangeDetectorRef,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
  ) {}

  @Input()
  public doubleProportionalResult!: DoubleProportionalResult;

  @Output()
  public update: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(SelectionDirective, { static: false })
  public selection!: SelectionDirective<DoubleProportionalResultSubApportionmentLotDecision>;

  public async ngOnInit(): Promise<void> {
    this.initialLoading = true;

    try {
      this.lotDecisions =
        await this.proportionalElectionUnionResultService.getDoubleProportionalResultSubApportionmentAvailableLotDecisions(
          this.doubleProportionalResult.proportionalElectionUnion!.id,
        );

      if (this.lotDecisions.length === 0) {
        return;
      }

      this.lotDecisionColumnDefs = flatten(this.lotDecisions[0].columns.map(c => c.cells)).map(this.getColumnDef);
      this.columns = this.defaultColumns.concat(this.lotDecisionColumnDefs);
    } finally {
      this.initialLoading = false;
    }

    if (
      this.doubleProportionalResult.subApportionmentState ===
      DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_COMPLETED
    ) {
      this.setInitialSelectedLotDecision();
    }
  }

  public async updateLotDecision(): Promise<void> {
    if (!this.selectedLotDecision) {
      return;
    }

    this.saving = true;

    try {
      await this.proportionalElectionUnionResultService.UpdateDoubleProportionalResultSubApportionmentLotDecision(
        this.doubleProportionalResult.proportionalElectionUnion!.id,
        this.selectedLotDecision.number,
      );
      this.toast.success(this.i18n.instant('APP.SAVED'));

      const lotDecisionCells = flatten(this.selectedLotDecision.columns.map(c => c.cells));

      for (const column of this.doubleProportionalResult.columns) {
        for (const cell of column.cells) {
          const lotDecisionCell = lotDecisionCells.find(c => c.list.id === cell.list.id);
          if (!lotDecisionCell) {
            continue;
          }

          cell.subApportionmentNumberOfMandates = lotDecisionCell.numberOfMandates;
        }

        column.subApportionmentNumberOfMandates = sum(column.cells, x => x.subApportionmentNumberOfMandates);
      }

      for (const row of this.doubleProportionalResult.rows) {
        for (const cell of row.cells) {
          const lotDecisionCell = lotDecisionCells.find(c => c.list.id === cell.list.id);
          if (!lotDecisionCell) {
            continue;
          }

          cell.subApportionmentNumberOfMandates = lotDecisionCell.numberOfMandates;
        }

        row.subApportionmentNumberOfMandates = sum(row.cells, x => x.subApportionmentNumberOfMandates);
      }

      this.doubleProportionalResult.subApportionmentState =
        DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_COMPLETED;
      this.doubleProportionalResult.subApportionmentNumberOfMandates = sum(
        this.doubleProportionalResult.columns,
        c => c.subApportionmentNumberOfMandates,
      );
      this.update.emit();
      this.newLotDecisionSelected = false;
    } finally {
      this.saving = false;
    }
  }

  public lotDecisionChange(selectedLotDecision?: DoubleProportionalResultSubApportionmentLotDecision) {
    this.selectedLotDecision = selectedLotDecision;
    this.newLotDecisionSelected = !!selectedLotDecision;
  }

  public getNumberOfMandatesByColumnDef(
    lotDecision: DoubleProportionalResultSubApportionmentLotDecision,
    lotDecisionColumnDef: string,
  ): number {
    return flatten(lotDecision.columns.map(c => c.cells)).find(co => this.getColumnDef(co) === lotDecisionColumnDef)!.numberOfMandates;
  }

  private getColumnDef(cell: DoubleProportionalResultSubApportionmentLotDecisionCell): string {
    return `${cell.election.domainOfInfluence!.name} / ${cell.list.orderNumber} - ${cell.list.shortDescription}`;
  }

  private setInitialSelectedLotDecision(): void {
    const dpResultCellsWithRequiredLotDecision = flatten(this.doubleProportionalResult.columns.map(c => c.cells)).filter(
      c => c.subApportionmentLotDecisionRequired,
    );

    for (const lotDecision of this.lotDecisions) {
      const dpResultCellNumberOfMandates = dpResultCellsWithRequiredLotDecision.map(c => c.subApportionmentNumberOfMandates);
      const lotDecisionCellNumberOfMandates = flatten(lotDecision.columns.map(c => c.cells)).map(c => c.numberOfMandates);

      // Calling toString for an array equals, where the array elements should be the same.
      if (dpResultCellNumberOfMandates.toString() === lotDecisionCellNumberOfMandates.toString()) {
        // Required for the selection (conditional ViewChild)
        this.cd.detectChanges();
        this.selection.toggleSelection(lotDecision);
      }
    }

    this.newLotDecisionSelected = false;
  }
}
