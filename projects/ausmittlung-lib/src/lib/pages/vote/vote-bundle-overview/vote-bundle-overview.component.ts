/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { VoteReviewProcedure } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/vote_pb';
import { Component, HostListener, inject } from '@angular/core';
import { Params } from '@angular/router';
import { PoliticalBusinessNewBundleNumberComponent } from '../../../components/political-business-new-bundle-number/political-business-new-bundle-number.component';
import { PoliticalBusinessResultBundle, VoteResultBundles } from '../../../models';
import { VoteResultBundleService } from '../../../services/vote-result-bundle.service';
import { PoliticalBusinessBundleOverviewComponent } from '../../political-business-bundle-overview/political-business-bundle-overview.component';
import { VoteBallotComponent } from '../vote-ballot/vote-ballot.component';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { Event, EventType, VoteResultBundleEventTypes } from '../../../models/event-log.model';
import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';

@Component({
  selector: 'vo-ausm-vote-bundle-overview',
  templateUrl: './vote-bundle-overview.component.html',
  styleUrls: ['./vote-bundle-overview.component.scss'],
  standalone: false,
})
export class VoteBundleOverviewComponent extends PoliticalBusinessBundleOverviewComponent<VoteResultBundles> {
  private readonly resultBundleService = inject(VoteResultBundleService);

  public readonly reviewProcedures: typeof VoteReviewProcedure = VoteReviewProcedure;

  public result?: VoteResultBundles;
  public isCreatingBundle: boolean = false;

  constructor() {
    super();
  }

  public get watcherEventTypes(): EventType[] {
    return [...VoteResultBundleEventTypes];
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
      const response = await this.resultBundleService.createBundle(
        this.result.politicalBusinessResult.id,
        this.result.ballotResult.id,
        bundleNumber,
      );
      await this.router.navigate([response.bundleId, VoteBallotComponent.newId], {
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
    if (this.result?.politicalBusinessResult.entryParams?.reviewProcedure === VoteReviewProcedure.VOTE_REVIEW_PROCEDURE_PHYSICALLY) {
      return;
    }
    return super.reviewBundle(bundle);
  }

  public async succeedBundleReview(bundles: PoliticalBusinessResultBundle[]): Promise<void> {
    if (this.result?.politicalBusinessResult.entryParams?.reviewProcedure !== VoteReviewProcedure.VOTE_REVIEW_PROCEDURE_PHYSICALLY) {
      return;
    }

    return this.resultBundleService.succeedBundleReview(bundles.map(x => x.id));
  }

  public async rejectBundleReview(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (this.result?.politicalBusinessResult.entryParams?.reviewProcedure !== VoteReviewProcedure.VOTE_REVIEW_PROCEDURE_PHYSICALLY) {
      return;
    }

    return this.resultBundleService.rejectBundleReview(bundle.id);
  }

  public async resetBundle(bundle: PoliticalBusinessResultBundle): Promise<void> {
    return this.resultBundleService.resetBundleToSubmissionFinished(bundle.id);
  }

  protected deleteBundleById(bundleId: string): Promise<void> {
    return this.resultBundleService.deleteBundle(bundleId, this.result!.ballotResult.id);
  }

  protected loadBundles(resultId: string, params: Params): Promise<VoteResultBundles> {
    return this.resultBundleService.getBundles(params.ballotResultId);
  }

  protected async loadBundle(id: string): Promise<PoliticalBusinessResultBundle> {
    return (await this.resultBundleService.getBundle(id)).bundle;
  }

  protected get politicalBusinessType(): PoliticalBusinessType {
    return PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE;
  }

  protected get resultId(): string | undefined {
    return this.result?.ballotResult.id;
  }

  protected async handleEvent(e: Event, params: Params): Promise<void> {
    await super.handleEvent(e, params);

    switch (e.type) {
      case 'VoteResultBundleCreated':
        await this.handleBundleCreated(e.entityId);
        break;
      case 'VoteResultBundleDeleted':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_DELETED, e.data.bundleLog!);
        break;
      case 'VoteResultBundleReviewSucceeded':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED, e.data.bundleLog!);
        break;
      case 'VoteResultBundleReviewRejected':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION, e.data.bundleLog!);
        break;
      case 'VoteResultBundleSubmissionFinished':
      case 'VoteResultBundleCorrectionFinished':
      case 'VoteResultBundleResetToSubmissionFinished':
        this.setBundleState(e.entityId, BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW, e.data.bundleLog!);
        break;
      case 'VoteResultBallotCreated':
        this.adjustCountOfBallots(e.entityId, 1);
        break;
      case 'VoteResultBallotDeleted':
        this.adjustCountOfBallots(e.entityId, -1);
        break;
    }
  }
}
