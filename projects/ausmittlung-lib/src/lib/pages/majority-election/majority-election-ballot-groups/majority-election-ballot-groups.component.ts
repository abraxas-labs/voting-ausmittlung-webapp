/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { Component, HostListener, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MajorityElectionBallotGroupResult, MajorityElectionBallotGroupResults } from '../../../models';
import { MajorityElectionResultService } from '../../../services/majority-election-result.service';
import { PermissionService } from '../../../services/permission.service';
import { sum } from '../../../services/utils/array.utils';
import { NumberComponent } from '@abraxas/base-components';
import { Permissions } from '../../../models/permissions.model';
import { HasUnsavedChanges } from '../../../services/guards/has-unsaved-changes.guard';

@Component({
  selector: 'vo-ausm-majority-election-ballot-groups',
  templateUrl: './majority-election-ballot-groups.component.html',
  styleUrls: ['./majority-election-ballot-groups.component.scss'],
})
export class MajorityElectionBallotGroupsComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  @ViewChildren(NumberComponent)
  public ballotGroupComponents?: QueryList<NumberComponent>;

  public result?: MajorityElectionBallotGroupResults;
  public focusedBallotGroup?: MajorityElectionBallotGroupResult;
  public total: number = 0;
  public loading: boolean = true;
  public saving: boolean = false;
  public canEdit: boolean = false;
  public canSave: boolean = false;
  public hasChanges: boolean = false;
  public resultReadOnly: boolean = false;

  private readonly routeParamsSubscription: Subscription;

  constructor(
    private readonly permissionService: PermissionService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    private readonly router: Router,
    private readonly resultService: MajorityElectionResultService,
    private readonly themeService: ThemeService,
    route: ActivatedRoute,
  ) {
    this.routeParamsSubscription = route.params.subscribe(({ resultId }) => this.loadData(resultId));
  }

  public async ngOnInit(): Promise<void> {
    this.canEdit = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.EnterResults);
  }

  public get hasUnsavedChanges(): boolean {
    return this.hasChanges;
  }

  public async back(): Promise<void> {
    await this.navigateToContestDetail();
  }

  public async save(): Promise<void> {
    if (!this.result) {
      return;
    }

    this.saving = true;
    try {
      await this.resultService.enterBallotGroupResults(this.result.electionResult.id, this.result.ballotGroupResults);
      this.toast.success(this.i18n.instant('APP.SAVED'));
      this.hasChanges = false;
      await this.navigateToContestDetail();
    } finally {
      this.saving = false;
    }
  }

  public updateTotalAndSetChanges(): void {
    if (!this.result) {
      return;
    }
    this.total = sum(this.result.ballotGroupResults, r => r.voteCount);
    this.canSave = this.result?.ballotGroupResults.every(x => x.voteCount >= 0) ?? false;
    this.hasChanges = true;
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  private async loadData(resultId: string): Promise<void> {
    this.loading = true;
    try {
      this.result = await this.resultService.getBallotGroups(resultId);
      this.resultReadOnly =
        this.result.electionResult.election.contest!.locked ||
        (this.result.electionResult.state !== CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION &&
          this.result.electionResult.state !== CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING);
      this.updateTotalAndSetChanges();
      this.hasChanges = false;
    } finally {
      this.loading = false;

      // setTimeout is needed to make sure all components are visible
      setTimeout(() => this.ballotGroupComponents?.first.setFocus());
    }
  }

  private async navigateToContestDetail(): Promise<void> {
    if (!this.result) {
      return;
    }

    await this.router.navigate(
      [
        this.themeService.theme$.value,
        'contests',
        this.result.electionResult.election.contestId,
        this.result.electionResult.countingCircleId,
      ],
      {
        queryParams: {
          politicalBusinessId: this.result.electionResult.election.id,
        },
      },
    );
  }
}
