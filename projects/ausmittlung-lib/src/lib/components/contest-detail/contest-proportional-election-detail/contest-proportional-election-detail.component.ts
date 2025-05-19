/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  ContestCountingCircleDetails,
  ProportionalElectionResult,
  updateCountOfVotersCalculatedFields,
  ValidationSummary,
} from '../../../models';
import { PoliticalBusinessResultService } from '../../../services/political-business-result.service';
import { ProportionalElectionResultService } from '../../../services/proportional-election-result.service';
import { PermissionService } from '../../../services/permission.service';
import { SecondFactorTransactionService } from '../../../services/second-factor-transaction.service';
import { BallotCountInputComponent } from '../../ballot-count-input/ballot-count-input.component';
import { AbstractContestPoliticalBusinessDetailComponent } from '../contest-political-business-detail/contest-political-business-detail-base.component';
import { ContestPoliticalBusinessDetailComponent } from '../contest-political-business-detail/contest-political-business-detail.component';
import { Permissions } from '../../../models/permissions.model';
import { VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL } from '../../../tokens';
import { UnsavedChangesService } from '../../../services/unsaved-changes.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'vo-ausm-contest-proportional-election-detail',
  templateUrl: './contest-proportional-election-detail.component.html',
  styleUrls: ['./contest-proportional-election-detail.component.scss'],
  standalone: false,
})
export class ContestProportionalElectionDetailComponent
  extends AbstractContestPoliticalBusinessDetailComponent<ProportionalElectionResult, ProportionalElectionResultService>
  implements OnInit
{
  public countOfVotersValid: boolean = true;
  public canReadListResults: boolean = false;

  @ViewChild(BallotCountInputComponent)
  private ballotCountInputComponent?: BallotCountInputComponent;

  constructor(
    @Inject(VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL) votingAusmittlungMonitoringWebAppUrl: string,
    parent: ContestPoliticalBusinessDetailComponent,
    i18n: TranslateService,
    toast: SnackbarService,
    roleService: PermissionService,
    resultService: ProportionalElectionResultService,
    dialog: DialogService,
    secondFactorTransactionService: SecondFactorTransactionService,
    politicalBusinessResultService: PoliticalBusinessResultService,
    cd: ChangeDetectorRef,
    themeService: ThemeService,
    unsavedChangesService: UnsavedChangesService,
    private readonly router: Router,
  ) {
    super(
      votingAusmittlungMonitoringWebAppUrl,
      i18n,
      toast,
      resultService,
      dialog,
      secondFactorTransactionService,
      politicalBusinessResultService,
      cd,
      roleService,
      themeService,
      unsavedChangesService,
      parent,
    );
  }

  public override async ngOnInit(): Promise<void> {
    await super.ngOnInit();
    this.canReadListResults = await this.permissionService.hasPermission(Permissions.ProportionalElectionListResult.Read);
  }

  public resetResults(): void {
    if (!this.resultDetail) {
      return;
    }

    this.resultDetail.totalCountOfLists = 0;
    this.resultDetail.totalCountOfUnmodifiedLists = 0;
    this.resultDetail.totalCountOfBallots = 0;
    this.resultDetail.allBundlesReviewedOrDeleted = true;
  }

  public countingCircleDetailsUpdated(values: ContestCountingCircleDetails): void {
    super.countingCircleDetailsUpdated(values);

    if (!this.resultDetail) {
      return;
    }

    updateCountOfVotersCalculatedFields(this.resultDetail.countOfVoters, this.resultDetail.totalCountOfVoters);
  }

  public updateCountOfVotersValid(): void {
    this.countOfVotersValid = !!this.resultDetail && this.areCountOfVotersValid(this.resultDetail.countOfVoters);
  }

  public async save(): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    try {
      this.isActionExecuting = true;

      await this.resultService.enterCountOfVoters(this.resultDetail.id, this.resultDetail.countOfVoters);
      this.lastSavedResultDetail = cloneDeep(this.resultDetail);
      this.toast.success(this.i18n.instant('APP.SAVED'));
      this.unsavedChangesService.removeUnsavedChange(this.resultDetail.id);
    } finally {
      this.isActionExecuting = false;
    }
  }

  public async validateAndSave(): Promise<void> {
    try {
      this.isActionExecuting = true;

      const validationConfirm = await this.confirmValidationOverviewDialog(false);
      if (!validationConfirm) {
        return;
      }

      await this.save();
    } finally {
      this.isActionExecuting = false;
    }
  }

  public async openUnmodifiedLists(): Promise<void> {
    if (!this.resultDetail || !this.canReadListResults) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'proportional-election-result', this.resultDetail.id, 'unmodified']);
  }

  public async openModifiedLists(): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'proportional-election-result', this.resultDetail.id, 'bundles']);
  }

  public async navigateToResults(): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'proportional-election-result', this.resultDetail.id, 'results']);
  }

  public setFocus(): void {
    // detect changes to make sure that all components are visible
    this.cd.detectChanges();

    this.ballotCountInputComponent?.setFocus();
  }

  protected async loadValidationSummary(): Promise<ValidationSummary> {
    return this.resultService.validateEnterCountOfVoters(this.resultDetail!.id, this.resultDetail!.countOfVoters);
  }
}
