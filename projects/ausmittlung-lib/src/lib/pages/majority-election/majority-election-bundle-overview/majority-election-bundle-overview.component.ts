/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { MajorityElectionReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_pb';
import { Component, HostListener, inject } from '@angular/core';
import { Params } from '@angular/router';
import { PoliticalBusinessNewBundleNumberComponent } from '../../../components/political-business-new-bundle-number/political-business-new-bundle-number.component';
import { MajorityElectionResultBundles, PoliticalBusinessResultBundle } from '../../../models';
import { MajorityElectionResultBundleService } from '../../../services/majority-election-result-bundle.service';
import { PoliticalBusinessBundleOverviewComponent } from '../../political-business-bundle-overview/political-business-bundle-overview.component';
import { MajorityElectionBallotComponent } from '../majority-election-ballot/majority-election-ballot.component';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { Event, EventType, MajorityElectionResultBundleEventTypes } from '../../../models/event-log.model';
import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';

@Component({
  selector: 'vo-ausm-majority-election-bundle-overview',
  templateUrl: './majority-election-bundle-overview.component.html',
  styleUrls: ['./majority-election-bundle-overview.component.scss'],
  standalone: false,
})
export class MajorityElectionBundleOverviewComponent extends PoliticalBusinessBundleOverviewComponent<MajorityElectionResultBundles> {
  private readonly resultBundleService = inject(MajorityElectionResultBundleService);

  public readonly reviewProcedures: typeof MajorityElectionReviewProcedure = MajorityElectionReviewProcedure;

  public result?: MajorityElectionResultBundles;
  public isCreatingBundle: boolean = false;

  constructor() {
    super();
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
      bundleNumber = await this.dialog.openForResult<PoliticalBusinessNewBundleNumberComponent, number>(
        PoliticalBusinessNewBundleNumberComponent,
        {},
      );
      if (!bundleNumber) {
        return;
      }
    }

    this.isCreatingBundle = true;
    try {
      this.createdBundleData = await this.resultBundleService.createBundle(this.result.politicalBusinessResult.id, bundleNumber);
      await this.dialog.alert(
        'APP.CONFIRM',
        this.i18n.instant('ELECTION.CONFIRM_BUNDLE_CREATION', { number: this.createdBundleData.bundleNumber }),
      );
      this.tryNavigateToCreatedBundleAfterDelay();
    } catch (err) {
      this.isCreatingBundle = false;
      throw err;
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

  public async resetBundle(bundle: PoliticalBusinessResultBundle): Promise<void> {
    return this.resultBundleService.resetBundleToSubmissionFinished(bundle.id);
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
      case 'MajorityElectionResultBundleResetToSubmissionFinished':
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
