/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { VoteReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/vote_pb';
import { AfterViewInit, Component, Input } from '@angular/core';
import { PermissionService } from '../../../services/permission.service';
import { UserService } from '../../../services/user.service';
import { ResultBundleTableComponent } from '../../result-bundle-table/result-bundle-table-component.directive';
import { EnumUtil } from '@abraxas/voting-lib';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';

@Component({
  selector: 'vo-ausm-vote-bundle-table',
  templateUrl: './vote-bundle-table.component.html',
  styleUrls: ['./vote-bundle-table.component.scss'],
})
export class VoteBundleTableComponent extends ResultBundleTableComponent implements AfterViewInit {
  public readonly columns = [
    this.selectColumn,
    this.numberColumn,
    this.bundleSizeColumn,
    this.createdByColumn,
    this.countOfBallotsColumn,
    this.stateColumn,
    this.reviewedByColumn,
    this.reviewColumn,
    this.actionsColumn,
  ];
  public readonly reviewProcedures: typeof VoteReviewProcedure = VoteReviewProcedure;
  public readonly protocolExportStates: typeof ProtocolExportState = ProtocolExportState;

  @Input()
  public reviewProcedure?: VoteReviewProcedure;

  constructor(userService: UserService, roleService: PermissionService, enumUtil: EnumUtil) {
    super(userService, roleService, enumUtil);
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    if (!this.enableReviewColumn) {
      this.columns.splice(this.columns.length - 2, 1);
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
