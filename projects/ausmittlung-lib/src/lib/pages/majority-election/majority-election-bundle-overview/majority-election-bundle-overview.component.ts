/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { MajorityElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_pb';
import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  PoliticalBusinessNewBundleNumberComponent,
  PoliticalBusinessNewBundleNumberComponentData,
} from '../../../components/political-business-new-bundle-number/political-business-new-bundle-number.component';
import { MajorityElectionResultBundles, PoliticalBusinessResultBundle } from '../../../models';
import { MajorityElectionResultBundleService } from '../../../services/majority-election-result-bundle.service';
import { ResultExportService } from '../../../services/result-export.service';
import { PermissionService } from '../../../services/permission.service';
import { PoliticalBusinessBundleOverviewComponent } from '../../political-business-bundle-overview/political-business-bundle-overview.component';
import { MajorityElectionBallotComponent } from '../majority-election-ballot/majority-election-ballot.component';
import { ExportService } from '../../../services/export.service';
import { DatePipe } from '@angular/common';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { EventLogService } from '../../../services/event-log.service';
import { Event, EventType, MajorityElectionResultBundleEventTypes } from '../../../models/event-log.model';
import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';

@Component({
  selector: 'vo-ausm-majority-election-bundle-overview',
  templateUrl: './majority-election-bundle-overview.component.html',
  styleUrls: ['./majority-election-bundle-overview.component.scss'],
  standalone: false,
})
export class MajorityElectionBundleOverviewComponent extends PoliticalBusinessBundleOverviewComponent<MajorityElectionResultBundles> {
  public readonly reviewProcedures: typeof MajorityElectionReviewProcedure = MajorityElectionReviewProcedure;

  public result?: MajorityElectionResultBundles;
  public isCreatingBundle: boolean = false;

  constructor(
    private readonly resultBundleService: MajorityElectionResultBundleService,
    permissionService: PermissionService,
    i18n: TranslateService,
    toast: SnackbarService,
    dialog: DialogService,
    route: ActivatedRoute,
    router: Router,
    themeService: ThemeService,
    resultExportService: ResultExportService,
    exportService: ExportService,
    eventLogService: EventLogService,
    datePipe: DatePipe,
  ) {
    super(
      permissionService,
      i18n,
      toast,
      dialog,
      route,
      router,
      themeService,
      resultExportService,
      exportService,
      eventLogService,
      datePipe,
    );
  }

  public get watcherEventTypes(): EventType[] {
    return [...MajorityElectionResultBundleEventTypes];
  }

  @HostListener('document:keydown.control.alt.q')
  public async createNewBundle(): Promise<void> {
    if (!this.result || !this.result.politicalBusinessResult.entryParams) {
      return;
    }

    let bundleNumber: number | undefined;
    if (!this.result.politicalBusinessResult.entryParams.automaticBallotBundleNumberGeneration) {
      const data: PoliticalBusinessNewBundleNumberComponentData = {
        deletedUnusedBundleNumbers: this.getDeletedUnusedBundleNumbers(this.result.bundles),
        usedBundleNumbers: this.getUsedBundleNumbers(this.result.bundles),
      };
      bundleNumber = await this.dialog.openForResult<PoliticalBusinessNewBundleNumberComponent, number>(
        PoliticalBusinessNewBundleNumberComponent,
        data,
      );
      if (!bundleNumber) {
        return;
      }
    }

    this.isCreatingBundle = true;
    try {
      const response = await this.resultBundleService.createBundle(this.result.politicalBusinessResult.id, bundleNumber);
      await this.dialog.alert('APP.CONFIRM', this.i18n.instant('ELECTION.CONFIRM_BUNDLE_CREATION', { number: response.bundleNumber }));
      await this.router.navigate([response.bundleId, MajorityElectionBallotComponent.newId], {
        relativeTo: this.route,
        queryParams: {
          bundleNumber: response.bundleNumber,
        },
      });
    } finally {
      this.isCreatingBundle = false;
    }
  }

  public async reviewBundle(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure ===
      MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }
    return super.reviewBundle(bundle);
  }

  public async succeedBundleReview(bundles: PoliticalBusinessResultBundle[]): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return this.resultBundleService.succeedBundleReview(bundles.map(x => x.id));
  }

  public async rejectBundleReview(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return this.resultBundleService.rejectBundleReview(bundle.id);
  }

  public async generateBundleReviewExport(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return super.generateBundleReviewExport(bundle);
  }

  public async downloadBundleReviewExport(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      MajorityElectionReviewProcedure.MAJORITY_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return super.downloadBundleReviewExport(bundle);
  }

  protected deleteBundleById(bundleId: string): Promise<void> {
    return this.resultBundleService.deleteBundle(bundleId);
  }

  protected loadBundles(resultId: string): Promise<MajorityElectionResultBundles> {
    return this.resultBundleService.getBundles(resultId);
  }

  protected async loadBundle(id: string): Promise<PoliticalBusinessResultBundle> {
    return (await this.resultBundleService.getBundle(id)).bundle;
  }

  protected get politicalBusinessType(): PoliticalBusinessType {
    return PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION;
  }

  protected get resultId(): string | undefined {
    return this.result?.politicalBusinessResult.id;
  }

  protected async handleEvent(e: Event, params: Params): Promise<void> {
    await super.handleEvent(e, params);

    switch (e.type) {
      case 'MajorityElectionResultBundleCreated':
        await this.handleBundleCreated(e.entityId);
        break;
      case 'MajorityElectionResultBundleDeleted':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_DELETED, e.data.bundleLog!);
        break;
      case 'MajorityElectionResultBundleReviewSucceeded':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED, e.data.bundleLog!);
        break;
      case 'MajorityElectionResultBundleReviewRejected':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION, e.data.bundleLog!);
        break;
      case 'MajorityElectionResultBundleSubmissionFinished':
      case 'MajorityElectionResultBundleCorrectionFinished':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW, e.data.bundleLog!);
        break;
      case 'MajorityElectionResultBallotCreated':
        this.adjustCountOfBallots(e.entityId, 1);
        break;
      case 'MajorityElectionResultBallotDeleted':
        this.adjustCountOfBallots(e.entityId, -1);
        break;
    }
  }
}
