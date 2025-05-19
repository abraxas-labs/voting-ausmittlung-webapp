/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ProportionalElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/proportional_election_pb';
import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  ProportionalElectionNewBundleComponent,
  ProportionalElectionNewBundleComponentData,
  ProportionalElectionNewBundleComponentResult,
} from '../../../components/proportional-election/proportional-election-new-bundle/proportional-election-new-bundle.component';
import { PoliticalBusinessResultBundle, ProportionalElectionResultBundle, ProportionalElectionResultBundles } from '../../../models';
import { ProportionalElectionResultBundleService } from '../../../services/proportional-election-result-bundle.service';
import { ResultExportService } from '../../../services/result-export.service';
import { PermissionService } from '../../../services/permission.service';
import { PoliticalBusinessBundleOverviewComponent } from '../../political-business-bundle-overview/political-business-bundle-overview.component';
import { ProportionalElectionBallotComponent } from '../proportional-election-ballot/proportional-election-ballot.component';
import { ExportService } from '../../../services/export.service';
import { DatePipe } from '@angular/common';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { EventLogService } from '../../../services/event-log.service';
import { Event, EventType, ProportionalElectionResultBundleEventTypes } from '../../../models/event-log.model';
import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';

@Component({
  selector: 'vo-ausm-proportional-election-bundle-overview',
  templateUrl: './proportional-election-bundle-overview.component.html',
  styleUrls: ['./proportional-election-bundle-overview.component.scss'],
  standalone: false,
})
export class ProportionalElectionBundleOverviewComponent extends PoliticalBusinessBundleOverviewComponent<ProportionalElectionResultBundles> {
  public readonly reviewProcedures: typeof ProportionalElectionReviewProcedure = ProportionalElectionReviewProcedure;

  constructor(
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
    private readonly resultBundleService: ProportionalElectionResultBundleService,
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
    return [...ProportionalElectionResultBundleEventTypes];
  }

  @HostListener('document:keydown.control.alt.q')
  public async createNewBundle(): Promise<void> {
    if (!this.result) {
      return;
    }

    const data: ProportionalElectionNewBundleComponentData = {
      electionId: this.result.politicalBusinessResult.election.id,
      electionResultId: this.result.politicalBusinessResult.id,
      enableBundleNumber: !this.result.politicalBusinessResult.entryParams.automaticBallotBundleNumberGeneration,
      usedBundleNumbers: this.getUsedBundleNumbers(this.result.bundles),
      deletedUnusedBundleNumbers: this.getDeletedUnusedBundleNumbers(this.result.bundles),
    };
    const result = await this.dialog.openForResult<ProportionalElectionNewBundleComponent, ProportionalElectionNewBundleComponentResult>(
      ProportionalElectionNewBundleComponent,
      data,
    );
    if (result) {
      await this.dialog.alert('APP.CONFIRM', this.i18n.instant('ELECTION.CONFIRM_BUNDLE_CREATION', { number: result.bundleNumber }));
      await this.router.navigate([result.bundleId, ProportionalElectionBallotComponent.newId], {
        relativeTo: this.route,
        queryParams: {
          listId: result.listId,
          bundleNumber: result.bundleNumber,
        },
      });
    }
  }

  public async reviewBundle(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure ===
      ProportionalElectionReviewProcedure.PROPORTIONAL_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }
    return super.reviewBundle(bundle);
  }

  public async succeedBundleReview(bundles: PoliticalBusinessResultBundle[]): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      ProportionalElectionReviewProcedure.PROPORTIONAL_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return this.resultBundleService.succeedBundleReview(bundles.map(x => x.id));
  }

  public async rejectBundleReview(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      ProportionalElectionReviewProcedure.PROPORTIONAL_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return this.resultBundleService.rejectBundleReview(bundle.id);
  }

  public async generateBundleReviewExport(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      ProportionalElectionReviewProcedure.PROPORTIONAL_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return super.generateBundleReviewExport(bundle);
  }

  public async downloadBundleReviewExport(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (
      this.result?.politicalBusinessResult.entryParams?.reviewProcedure !==
      ProportionalElectionReviewProcedure.PROPORTIONAL_ELECTION_REVIEW_PROCEDURE_PHYSICALLY
    ) {
      return;
    }

    return super.downloadBundleReviewExport(bundle);
  }

  protected deleteBundleById(bundleId: string): Promise<void> {
    return this.resultBundleService.deleteBundle(bundleId);
  }

  protected loadBundles(resultId: string): Promise<ProportionalElectionResultBundles> {
    return this.resultBundleService.getBundles(resultId);
  }

  protected async loadBundle(id: string): Promise<ProportionalElectionResultBundle> {
    return (await this.resultBundleService.getBundle(id)).bundle;
  }

  protected get politicalBusinessType(): PoliticalBusinessType {
    return PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION;
  }

  protected get resultId(): string | undefined {
    return this.result?.politicalBusinessResult.id;
  }

  protected async handleEvent(e: Event, params: Params): Promise<void> {
    await super.handleEvent(e, params);

    switch (e.type) {
      case 'ProportionalElectionResultBundleCreated':
        await this.handleBundleCreated(e.entityId);
        break;
      case 'ProportionalElectionResultBundleDeleted':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_DELETED, e.data.bundleLog!);
        break;
      case 'ProportionalElectionResultBundleReviewSucceeded':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED, e.data.bundleLog!);
        break;
      case 'ProportionalElectionResultBundleReviewRejected':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION, e.data.bundleLog!);
        break;
      case 'ProportionalElectionResultBundleSubmissionFinished':
      case 'ProportionalElectionResultBundleCorrectionFinished':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW, e.data.bundleLog!);
        break;
      case 'ProportionalElectionResultBallotCreated':
        this.adjustCountOfBallots(e.entityId, 1);
        break;
      case 'ProportionalElectionResultBallotDeleted':
        this.adjustCountOfBallots(e.entityId, -1);
        break;
    }
  }
}
