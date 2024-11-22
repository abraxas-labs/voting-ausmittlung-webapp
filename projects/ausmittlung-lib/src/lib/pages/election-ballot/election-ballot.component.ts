/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ConfirmDialogComponent } from '@abraxas/voting-lib';
import { ConfirmDialogData, ConfirmDialogResult } from '@abraxas/voting-lib/lib/components/dialog/confirm-dialog/confirm-dialog.component';
import { BallotNumberGeneration, MajorityElectionResult, PoliticalBusinessResultBundle, ProportionalElectionResult } from '../../models';
import { ElectionResultBallot } from '../../models/election-result-ballot.model';
import { PoliticalBusinessBallotComponent } from '../political-business-ballot/political-business-ballot.component';
import { Directive } from '@angular/core';

@Directive()
export abstract class ElectionBallotComponent<
  TResult extends ProportionalElectionResult | MajorityElectionResult,
  TBundle extends PoliticalBusinessResultBundle,
  TBallot extends ElectionResultBallot,
> extends PoliticalBusinessBallotComponent<TResult, TBundle, TBallot> {
  public emptyVoteCountValid: boolean = true;

  protected abstract get ballotBundleSize(): number | undefined;

  protected abstract get ballotNumberGeneration(): BallotNumberGeneration | undefined;

  protected get deletedBallotLabel(): string {
    return 'ELECTION.BALLOT_DETAIL.DELETED';
  }

  public async submitBundleAndNavigate(): Promise<void> {
    if (!this.bundle || !this.politicalBusinessResult || !(await this.saveBallot())) {
      return;
    }

    if (this.ballotBundleSize && this.bundle.countOfBallots !== this.ballotBundleSize) {
      const data: ConfirmDialogData = {
        title: 'ELECTION.BALLOT_DETAIL.CONFIRM_BUNDLE_NOT_FULL.TITLE',
        message: this.i18n.instant('ELECTION.BALLOT_DETAIL.CONFIRM_BUNDLE_NOT_FULL.MSG', {
          ballotBundleSize: this.ballotBundleSize,
        }),
        confirmText: 'COMMON.CANCEL',
        cancelText: 'ELECTION.BALLOT_DETAIL.CONFIRM_BUNDLE_NOT_FULL.CONTINUE',
        showCancel: true,
      };
      const result = await this.dialog.openForResult<ConfirmDialogComponent, ConfirmDialogResult | undefined>(ConfirmDialogComponent, data);

      // a truthy return value means cancel in this case, since the primary button should be the button to cancel
      if (!result || result.confirmed) {
        return;
      }
    }

    await super.submitBundleAndNavigate();
  }

  protected abstract isBallotUnchanged(): boolean;

  protected async validateBallot(): Promise<boolean> {
    if (!(await this.validateEmptyVoteCount())) {
      return false;
    }

    if (this.isBallotUnchanged()) {
      const saveUnchangedBallot = await this.dialog.confirm(
        this.i18n.instant('ELECTION.BALLOT_DETAIL.UNCHANGED_BALLOT.TITLE'),
        this.i18n.instant('ELECTION.BALLOT_DETAIL.UNCHANGED_BALLOT.MSG'),
        this.i18n.instant('COMMON.SAVE'),
      );

      if (!saveUnchangedBallot) {
        return false;
      }
    }

    return true;
  }

  protected computeBundleData(): void {
    if (!this.politicalBusinessResult || !this.bundle || this.ballotNumberGeneration === undefined) {
      return;
    }

    if (
      this.ballotNumberGeneration === BallotNumberGeneration.BALLOT_NUMBER_GENERATION_CONTINUOUS_FOR_ALL_BUNDLES &&
      this.ballotBundleSize
    ) {
      this.minBallotNumber = (this.bundle.number - 1) * this.ballotBundleSize + 1;
    } else {
      this.minBallotNumber = 1;
    }

    super.computeBundleData();
  }

  private async validateEmptyVoteCount(): Promise<boolean> {
    if (!this.ballot || this.emptyVoteCountValid) {
      return true;
    }

    await this.dialog.alert(
      this.i18n.instant('ELECTION.BALLOT_DETAIL.INVALID_EMPTY_VOTE_COUNT.TITLE'),
      this.i18n.instant('ELECTION.BALLOT_DETAIL.INVALID_EMPTY_VOTE_COUNT.MSG'),
    );
    return false;
  }
}
