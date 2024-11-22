/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ProportionalElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/proportional_election_pb';
import { AfterViewInit, Component, Input } from '@angular/core';
import { ProportionalElectionResultBundle } from '../../../models';
import { PermissionService } from '../../../services/permission.service';
import { UserService } from '../../../services/user.service';
import { ResultBundleTableComponent } from '../../result-bundle-table/result-bundle-table-component.directive';
import { EnumUtil } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';

@Component({
  selector: 'vo-ausm-proportional-election-bundle-table',
  templateUrl: './proportional-election-bundle-table.component.html',
  styleUrls: ['./proportional-election-bundle-table.component.scss'],
})
export class ProportionalElectionBundleTableComponent
  extends ResultBundleTableComponent<ProportionalElectionResultBundle>
  implements AfterViewInit
{
  public readonly listShortDescriptionColumn = 'listShortDescription';
  public readonly listOrderNumberColumn = 'listOrderNumber';
  public readonly columns = [
    this.selectColumn,
    this.numberColumn,
    this.bundleSizeColumn,
    this.listOrderNumberColumn,
    this.listShortDescriptionColumn,
    this.createdByColumn,
    this.countOfBallotsColumn,
    this.stateColumn,
    this.reviewedByColumn,
    this.reviewColumn,
    this.actionsColumn,
  ];
  public readonly reviewProcedures: typeof ProportionalElectionReviewProcedure = ProportionalElectionReviewProcedure;
  public readonly protocolExportStates: typeof ProtocolExportState = ProtocolExportState;

  @Input()
  public reviewProcedure?: ProportionalElectionReviewProcedure;

  constructor(
    userService: UserService,
    roleService: PermissionService,
    enumUtil: EnumUtil,
    private readonly i18n: TranslateService,
  ) {
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
    return this.reviewProcedure === ProportionalElectionReviewProcedure.PROPORTIONAL_ELECTION_REVIEW_PROCEDURE_ELECTRONICALLY;
  }

  protected dataAccessor(data: ProportionalElectionResultBundle, filterId: string): string | number | Date {
    if (filterId === this.listOrderNumberColumn) {
      return data.list?.orderNumber ?? 0;
    }

    if (filterId === this.listShortDescriptionColumn) {
      return data.list ? data.list.shortDescription : this.i18n.instant('PROPORTIONAL_ELECTION.BALLOT_WITHOUT_LIST_SHORT');
    }

    return super.dataAccessor(data, filterId);
  }
}
