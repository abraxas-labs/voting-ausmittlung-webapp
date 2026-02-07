/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { VoteReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/vote_pb';
import { AfterViewInit, Component, Input } from '@angular/core';
import { ResultBundleTableComponent } from '../../result-bundle-table/result-bundle-table-component.directive';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';

@Component({
  selector: 'vo-ausm-vote-bundle-table',
  templateUrl: './vote-bundle-table.component.html',
  styleUrls: ['./vote-bundle-table.component.scss'],
  standalone: false,
})
export class VoteBundleTableComponent extends ResultBundleTableComponent implements AfterViewInit {
  // if this is adjusted any modifications on it need to be adjusted too
  // (Index based hide/show of columns)
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
  public readonly reviewProcedures: typeof VoteReviewProcedure = VoteReviewProcedure;
  public readonly protocolExportStates: typeof ProtocolExportState = ProtocolExportState;

  @Input()
  public reviewProcedure?: VoteReviewProcedure;

  @Input()
  public enableBundleSizeColumn: boolean = true;

  constructor() {
    super();
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    if (!this.enableBundleSizeColumn) {
      this.columns.splice(2, 1);
    }

    if (!this.enableActions) {
      this.columns.splice(this.columns.length - 1, 1);
    }

    if (!this.enableReviewMultiple) {
      this.columns.splice(0, 1);
    }
  }

  protected isReviewProcedureElectronically(): boolean {
    return this.reviewProcedure === VoteReviewProcedure.VOTE_REVIEW_PROCEDURE_ELECTRONICALLY;
  }
}
