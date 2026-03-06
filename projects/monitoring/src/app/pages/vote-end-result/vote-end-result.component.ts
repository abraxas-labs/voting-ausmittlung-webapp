/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  SecondFactorTransactionService,
  VoteEndResult,
  VoteResultService,
  VoteEndResultEventTypes,
  EventLogService,
  PermissionService,
  Permissions,
} from 'ausmittlung-lib';
import { combineLatest, debounceTime, map, Subscription } from 'rxjs';
import { EndResultStep } from '../../models/end-result-step.model';

@Component({
  selector: 'app-vote-end-result',
  templateUrl: './vote-end-result.component.html',
  styleUrls: ['./vote-end-result.component.scss'],
  standalone: false,
})
export class VoteEndResultComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly resultService = inject(VoteResultService);
  private readonly i18n = inject(TranslateService);
  private readonly toast = inject(SnackbarService);
  private readonly dialog = inject(DialogService);
  private readonly eventLogService = inject(EventLogService);
  private readonly secondFactorTransactionService = inject(SecondFactorTransactionService);
  private readonly router = inject(Router);
  private readonly permissionService = inject(PermissionService);

  public loading: boolean = true;
  public stepActionLoading: boolean = false;
  public endResult?: VoteEndResult;
  public isPartialResult = false;
  public voteId = '';
  public endResultStep?: EndResultStep;
  public finalizeEnabled = false;
  public showExport = false;

  private readonly routeSubscription: Subscription;
  private watchSubscription?: Subscription;

  constructor() {
    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        debounceTime(10), // could fire twice if both params change at the same time
        map(([params, queryParams]) => ({
          politicalBusinessId: params.politicalBusinessId,
          isPartialResult: queryParams.partialResult,
          submissionFinishedAndAuditedTentatively: queryParams.submissionFinishedAndAuditedTentatively,
        })),
      )
      .subscribe(async ({ politicalBusinessId, isPartialResult, submissionFinishedAndAuditedTentatively }) => {
        this.isPartialResult = isPartialResult;
        this.voteId = politicalBusinessId;

        this.watchSubscription?.unsubscribe();
        delete this.watchSubscription;

        await this.loadData(politicalBusinessId);

        if (!!submissionFinishedAndAuditedTentatively && this.showExport) {
          this.router.navigate(['../../', 'contests', this.endResult!.contest.id, 'exports'], { relativeTo: this.route });
        }

        this.watchSubscription = this.eventLogService
          .watch([...VoteEndResultEventTypes], { contestId: this.endResult!.contest.id, politicalBusinessId: this.voteId })
          .pipe(debounceTime(1000)) // refresh once a second at max
          .subscribe(() => this.loadData(false));
      });
  }

  public async ngOnDestroy(): Promise<void> {
    this.routeSubscription.unsubscribe();
    this.watchSubscription?.unsubscribe();
  }

  public async handleEndResultStepChange(newStep: EndResultStep): Promise<void> {
    if (!this.endResultStep || !this.endResult) {
      return;
    }

    let success = false;

    try {
      this.stepActionLoading = true;

      if (newStep === EndResultStep.AllCountingCirclesDone) {
        success = await this.setFinalized(false);
      }

      if (newStep === EndResultStep.Finalized) {
        success = await this.setFinalized(true);
      }

      if (success) {
        this.endResultStep = newStep;
      }

      await this.updateShowExport();
    } finally {
      this.stepActionLoading = false;
    }
  }

  public async setFinalized(finalize: boolean): Promise<boolean> {
    if (!this.endResult || finalize === this.endResult.finalized) {
      return false;
    }

    try {
      if (finalize) {
        const confirmed = await this.dialog.confirm('VOTE_END_RESULT.CONFIRM.TITLE', 'VOTE_END_RESULT.CONFIRM.MESSAGE', 'APP.CONFIRM');
        if (!confirmed) {
          return false;
        }

        const voteId = this.endResult.vote.id;
        const secondFactorTransaction = await this.resultService.prepareFinalizeEndResult(voteId);
        this.endResult.finalized = true;

        await this.secondFactorTransactionService
          .showDialogAndExecuteVerifyAction(
            () => this.resultService.finalizeEndResult(voteId, secondFactorTransaction.getId()),
            secondFactorTransaction.getCode(),
            secondFactorTransaction.getQrCode(),
          )
          .catch(err => {
            this.endResult!.finalized = false;
            throw err;
          });
      } else {
        await this.resultService.revertEndResultFinalization(this.endResult.vote.id);
        this.endResult.finalized = false;
      }

      this.toast.success(this.i18n.instant('APP.SAVED'));
      return true;
    } catch {
      return false;
    }
  }

  private async loadData(setLoading: boolean = true): Promise<void> {
    this.loading = setLoading;
    try {
      this.endResult = this.isPartialResult
        ? await this.resultService.getPartialEndResult(this.voteId)
        : await this.resultService.getEndResult(this.voteId);
      this.finalizeEnabled = !this.endResult.contest.cantonDefaults.endResultFinalizeDisabled;
      this.endResultStep = !this.endResult.allCountingCirclesDone
        ? EndResultStep.CountingCirclesCounting
        : !this.endResult.finalized
          ? EndResultStep.AllCountingCirclesDone
          : EndResultStep.Finalized;
      await this.updateShowExport();
    } finally {
      this.loading = false;
    }
  }

  private async updateShowExport(): Promise<void> {
    this.showExport = this.endResult!.finalized && (await this.permissionService.hasPermission(Permissions.Export.ExportData));
  }
}
