/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { MajorityElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_pb';
import { AfterViewInit, Component, Input } from '@angular/core';
import { ResultBundleTableComponent } from '../../result-bundle-table/result-bundle-table-component.directive';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';

@Component({
  selector: 'vo-ausm-majority-election-bundle-table',
  templateUrl: './majority-election-bundle-table.component.html',
  styleUrls: ['./majority-election-bundle-table.component.scss'],
  standalone: false,
})
export class MajorityElectionBundleTableComponent extends ResultBundleTableComponent implements AfterViewInit {
  public readonly columns = [
    this.selectColumn,
    this.numberColumn,
    this.bundleSizeColumn,
    this.createdByColumn,
    this.countOfBallotsColumn,
    this.countOfModifiedBallotsColumn,
    this.stateColumn,
    this.reviewedByColumn,
    this.reviewColumn,
    this.actionsColumn,
  ];
  public readonly reviewProcedures: typeof MajorityElectionReviewProcedure = MajorityElectionReviewProcedure;
  public readonly protocolExportStates: typeof ProtocolExportState = ProtocolExportState;

  @Input()
  public reviewProcedure?: MajorityElectionReviewProcedure;

  constructor() {
    super();
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    if (!this.enableActions) {
      this.columns.splice(this.columns.length - 1, 1);
    }

    if (!this.enableReviewMultiple) {
      this.columns.splice(0, 1);
    }
  }

  protected isReviewProcedureElectronically(): boolean {
    return this.reviewProcedure === MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_ELECTRONICALLY;
  }
}
