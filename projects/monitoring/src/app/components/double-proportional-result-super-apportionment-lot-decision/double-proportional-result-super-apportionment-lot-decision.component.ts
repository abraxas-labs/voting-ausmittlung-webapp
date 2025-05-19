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
  DoubleProportionalResultSuperApportionmentLotDecision,
  DoubleProportionalResultSuperApportionmentLotDecisionColumn,
  ProportionalElectionResultService,
  ProportionalElectionUnionResultService,
} from 'ausmittlung-lib';

@Component({
  selector: 'app-double-proportional-result-super-apportionment-lot-decision',
  templateUrl: './double-proportional-result-super-apportionment-lot-decision.component.html',
  styleUrl: './double-proportional-result-super-apportionment-lot-decision.component.scss',
  standalone: false,
})
export class DoubleProportionalResultSuperApportionmentLotDecisionComponent implements OnInit {
  private readonly defaultColumns = ['lot'];

  public columns: string[] = [];
  public lotDecisionColumnDefs: string[] = [];
  public newLotDecisionSelected = false;
  public selectedLotDecision?: DoubleProportionalResultSuperApportionmentLotDecision;

  public initialLoading = true;
  public saving = false;

  constructor(
    private readonly proportionalElectionResultService: ProportionalElectionResultService,
    private readonly proportionalElectionUnionResultService: ProportionalElectionUnionResultService,
    private readonly cd: ChangeDetectorRef,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
  ) {}

  @Input()
  public doubleProportionalResult!: DoubleProportionalResult;

  @ViewChild(SelectionDirective, { static: false })
  public selection!: SelectionDirective<DoubleProportionalResultSuperApportionmentLotDecision>;

  @Output()
  public update: EventEmitter<void> = new EventEmitter<void>();

  public lotDecisions: DoubleProportionalResultSuperApportionmentLotDecision[] = [];

  public async ngOnInit(): Promise<void> {
    try {
      this.lotDecisions =
        this.doubleProportionalResult.proportionalElectionUnion != null
          ? await this.proportionalElectionUnionResultService.getDoubleProportionalResultSuperApportionmentAvailableLotDecisions(
              this.doubleProportionalResult.proportionalElectionUnion.id,
            )
          : await this.proportionalElectionResultService.getDoubleProportionalResultSuperApportionmentAvailableLotDecisions(
              this.doubleProportionalResult.proportionalElection!.id,
            );

      if (this.lotDecisions.length === 0) {
        return;
      }

      this.lotDecisionColumnDefs = this.lotDecisions[0].columns.map(this.getColumnDef);
      this.columns = this.defaultColumns.concat(this.lotDecisionColumnDefs);
    } finally {
      this.initialLoading = false;
    }

    if (
      this.doubleProportionalResult.superApportionmentState ===
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
      if (this.doubleProportionalResult.proportionalElectionUnion != null) {
        await this.proportionalElectionUnionResultService.UpdateDoubleProportionalResultSuperApportionmentLotDecision(
          this.doubleProportionalResult.proportionalElectionUnion.id,
          this.selectedLotDecision.number,
        );
      } else {
        await this.proportionalElectionResultService.UpdateDoubleProportionalResultSuperApportionmentLotDecision(
          this.doubleProportionalResult.proportionalElection!.id,
          this.selectedLotDecision.number,
        );
      }

      this.toast.success(this.i18n.instant('APP.SAVED'));

      for (const column of this.doubleProportionalResult.columns) {
        const lotDecisionColumn = this.selectedLotDecision.columns.find(
          c => c.unionList?.id === column.unionList?.id && c.list?.id === column.list?.id,
        );
        if (!lotDecisionColumn) {
          continue;
        }

        column.superApportionmentNumberOfMandates = lotDecisionColumn.numberOfMandates;
      }

      this.doubleProportionalResult.superApportionmentState =
        DoubleProportionalResultApportionmentState.DOUBLE_PROPORTIONAL_RESULT_APPORTIONMENT_STATE_COMPLETED;
      this.update.emit();
      this.newLotDecisionSelected = false;
    } finally {
      this.saving = false;
    }
  }

  public lotDecisionChange(selectedLotDecision?: DoubleProportionalResultSuperApportionmentLotDecision) {
    this.selectedLotDecision = selectedLotDecision;
    this.newLotDecisionSelected = !!selectedLotDecision;
  }

  public getNumberOfMandatesByColumnDef(
    lotDecision: DoubleProportionalResultSuperApportionmentLotDecision,
    lotDecisionColumnDef: string,
  ): number {
    return lotDecision.columns.find(co => this.getColumnDef(co) === lotDecisionColumnDef)!.numberOfMandates;
  }

  private getColumnDef(column: DoubleProportionalResultSuperApportionmentLotDecisionColumn): string {
    return column.unionList != null
      ? `${column.unionList.orderNumber} - ${column.unionList.shortDescription}`
      : `${column.list!.orderNumber} - ${column.list?.shortDescription}`;
  }

  private setInitialSelectedLotDecision(): void {
    const dpResultColumnsWithRequiredLotDecision = this.doubleProportionalResult.columns.filter(
      c => c.superApportionmentLotDecisionRequired,
    );

    for (const lotDecision of this.lotDecisions) {
      const dpResultColumnNumberOfMandates = dpResultColumnsWithRequiredLotDecision.map(c => c.superApportionmentNumberOfMandates);
      const lotDecisionColumnNumberOfMandates = lotDecision.columns.map(c => c.numberOfMandates);

      // Calling toString for an array equals, where the array elements should be the same.
      if (dpResultColumnNumberOfMandates.toString() === lotDecisionColumnNumberOfMandates.toString()) {
        // Required for the selection (conditional ViewChild)
        this.cd.detectChanges();
        this.selection.toggleSelection(lotDecision);
      }
    }

    this.newLotDecisionSelected = false;
  }
}
