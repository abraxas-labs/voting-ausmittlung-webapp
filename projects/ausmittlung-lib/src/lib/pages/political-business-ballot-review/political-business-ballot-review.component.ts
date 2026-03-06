/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SnackbarService } from '@abraxas/voting-lib';
import { Directive, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BallotReview, PoliticalBusinessResultBundle, PoliticalBusinessResultBundleUiSnapshot, ReviewState, User } from '../../models';
import { PermissionService } from '../../services/permission.service';
import { Permissions } from '../../models/permissions.model';
import { UserService } from '../../services/user.service';

@Directive()
export abstract class PoliticalBusinessBallotReviewComponent implements OnInit {
  private isSelfModifiedBundle: boolean = false;

  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly permissionService = inject(PermissionService);
  protected readonly userService = inject(UserService);
  protected readonly i18n = inject(TranslateService);
  protected readonly toast = inject(SnackbarService);

  public loading: boolean = true;
  public loadingBallot: boolean = true;
  public actionExecuting: boolean = false;

  public bundle?: PoliticalBusinessResultBundle;
  public reviewBallots: BallotReview[] = [];

  public canSucceedSelfModifiedBundle: boolean = false;
  public canSucceed: boolean = false;
  public correctionOngoing: boolean = false;

  public currentUser?: User;

  public async ngOnInit(): Promise<void> {
    this.canSucceedSelfModifiedBundle = await this.permissionService.hasPermission(
      Permissions.PoliticalBusinessResultBundle.ReviewSelfModifiedBundle,
    );
    this.currentUser = await this.userService.getUser();
  }

  public updateState(): void {
    this.isSelfModifiedBundle = this.updateIsSelfModifiedBundle();

    this.canSucceed = this.canSucceedSelfModifiedBundle
      ? this.reviewBallots.every(x => x.state !== ReviewState.NOT_REVIEWED)
      : this.reviewBallots.every(x => x.state === ReviewState.OK) && !this.isSelfModifiedBundle;
  }

  public async back(): Promise<void> {
    const bundleUiSnapshot: PoliticalBusinessResultBundleUiSnapshot | undefined = !this.bundle
      ? undefined
      : {
          bundleId: this.bundle.id,
          bundleState: this.bundle.state,
          countOfBallots: this.bundle.countOfBallots,
        };

    await this.router.navigate(['../../'], {
      relativeTo: this.route,
      state: { bundleUiSnapshot },
    });
  }

  protected updateBundleModificationUsers(): void {
    if (!this.bundle || !this.currentUser || this.bundle.ballotModificationUserIds.includes(this.currentUser.secureConnectId)) {
      return;
    }

    this.bundle.ballotModificationUserIds = [...this.bundle.ballotModificationUserIds, this.currentUser.secureConnectId];
  }

  private updateIsSelfModifiedBundle(): boolean {
    if (!this.bundle || !this.currentUser) {
      return false;
    }

    return this.bundle.ballotModificationUserIds.some(userId => userId === this.currentUser!.secureConnectId);
  }
}
