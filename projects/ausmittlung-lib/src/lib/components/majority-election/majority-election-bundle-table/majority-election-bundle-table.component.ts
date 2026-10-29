/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { MajorityElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_pb';
import { AfterViewInit, Component, Input } from '@angular/core';
import { MajorityElectionResultBundle } from '../../../models';
import { ResultBundleTableComponent } from '../../result-bundle-table/result-bundle-table-component.directive';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';

@Component({
  selector: 'vo-ausm-majority-election-bundle-table',
  templateUrl: './majority-election-bundle-table.component.html',
  styleUrls: ['./majority-election-bundle-table.component.scss'],
  standalone: false,
})
export class MajorityElectionBundleTableComponent
  extends ResultBundleTableComponent<MajorityElectionResultBundle>
  implements AfterViewInit
{
  public readonly ballotGroupColumn = 'ballotGroup';
  public readonly columns = [
    this.selectColumn,
    this.numberColumn,
    this.bundleSizeColumn,
    this.ballotGroupColumn,
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

  @Input()
  public enableBallotGroup: boolean = false;

  constructor() {
    super();
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    if (!this.enableActions) {
      this.columns.splice(this.columns.length - 1, 1);
    }

    if (!this.enableBallotGroup) {
      this.columns.splice(3, 1);
    }

    if (!this.enableReviewMultiple) {
      this.columns.splice(0, 1);
    }
  }

  protected isReviewProcedureElectronically(): boolean {
    return this.reviewProcedure === MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_ELECTRONICALLY;
  }

  protected dataAccessor(data: MajorityElectionResultBundle, filterId: string): string | number | Date {
    if (filterId === this.ballotGroupColumn) {
      return data.ballotGroup?.shortDescription ?? '';
    }

    return super.dataAccessor(data, filterId);
  }
}
