/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { DialogService, SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ShortcutDialogComponent, ShortcutDialogData } from '../../components/ballot-shortcut-dialog/shortcut-dialog.component';
import {
  MajorityElectionResultBundles,
  PoliticalBusinessResultBundle,
  PoliticalBusinessResultBundleLog,
  PoliticalBusinessResultBundles,
  ProportionalElectionResultBundles,
  ProtocolExport,
  VoteResultBundles,
} from '../../models';
import { ResultExportService } from '../../services/result-export.service';
import { PermissionService } from '../../services/permission.service';
import { groupBySingle } from '../../services/utils/array.utils';
import { Permissions } from '../../models/permissions.model';
import { ExportService } from '../../services/export.service';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';
import { DatePipe } from '@angular/common';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { Event, EventType, ProtocolEventTypes } from '../../models/event-log.model';
import { EventLogService } from '../../services/event-log.service';

@Directive()
export abstract class PoliticalBusinessBundleOverviewComponent<
    T extends (ProportionalElectionResultBundles | MajorityElectionResultBundles | VoteResultBundles) &
      PoliticalBusinessResultBundles<TBundle>,
    TBundle extends PoliticalBusinessResultBundle = T extends PoliticalBusinessResultBundles<infer U> ? U : never,
  >
  implements OnInit, OnDestroy
{
  public result?: T;
  public resultReadOnly: boolean = true;
  public loading: boolean = true;
  public canCreateBundle: boolean = false;

  private bundlesById: Record<string, TBundle> = {};

  private routeParamsSubscription?: Subscription;
  private watchSubscription?: Subscription;

  protected constructor(
    protected readonly permissionService: PermissionService,
    protected readonly i18n: TranslateService,
    protected readonly toast: SnackbarService,
    protected readonly dialog: DialogService,
    protected readonly route: ActivatedRoute,
    protected readonly router: Router,
    protected readonly themeService: ThemeService,
    protected readonly resultExportService: ResultExportService,
    protected readonly exportService: ExportService,
    private readonly eventLogService: EventLogService,
    private readonly datePipe: DatePipe,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.routeParamsSubscription = this.route.params.subscribe(params => this.loadData(params));
    this.canCreateBundle = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBundle.Create);
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription?.unsubscribe();
    this.watchSubscription?.unsubscribe();
  }

  public async back(): Promise<void> {
    if (!this.result) {
      return;
    }

    await this.router.navigate(
      [
        this.themeService.theme$.value,
        'contests',
        this.result.politicalBusinessResult.politicalBusiness.contestId,
        this.result.politicalBusinessResult.countingCircleId,
      ],
      {
        queryParams: {
          politicalBusinessId: this.result.politicalBusinessResult.politicalBusiness.id,
        },
      },
    );
  }

  public async openBundle({ id }: PoliticalBusinessResultBundle): Promise<void> {
    await this.router.navigate([id, 0], { relativeTo: this.route });
  }

  public async reviewBundle({ id }: PoliticalBusinessResultBundle): Promise<void> {
    await this.router.navigate([id, 'review'], { relativeTo: this.route });
  }

  public async deleteBundle(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (!this.result) {
      return;
    }

    const confirmed = await this.dialog.confirm(
      'POLITICAL_BUSINESS.BUNDLE_DELETE_CONFIRM.TITLE',
      'POLITICAL_BUSINESS.BUNDLE_DELETE_CONFIRM.MSG',
      'APP.DELETE',
    );
    if (!confirmed) {
      return;
    }

    await this.deleteBundleById(bundle.id);

    bundle.state = BallotBundleState.BALLOT_BUNDLE_STATE_DELETED;
    this.updateBundles();
    this.toast.success(this.i18n.instant('APP.DELETED'));
  }

  public showShortcutDialog(): void {
    const data: ShortcutDialogData = {
      shortcuts: [
        {
          text: 'POLITICAL_BUSINESS.SHORTCUT.NEW_BUNDLE.TEXT',
          combination: 'POLITICAL_BUSINESS.SHORTCUT.NEW_BUNDLE.COMBINATION',
        },
      ],
    };
    this.dialog.open(ShortcutDialogComponent, data);
  }

  public async generateBundleReviewExport(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (!this.result) {
      return;
    }

    if (!(await this.confirmGenerationIfNeeded(bundle.protocolExport))) {
      return;
    }

    // set state immediately to generating to show the loading bar
    this.setProtocolExportState(bundle, ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING);
    bundle.protocolExport!.protocolExportId = await this.exportService.startBundleReviewExport(bundle.id, this.politicalBusinessType);
  }

  public async downloadBundleReviewExport(bundle: PoliticalBusinessResultBundle): Promise<void> {
    if (!this.result) {
      return;
    }

    const contestId = this.result.politicalBusinessResult.politicalBusiness.contestId;
    const countingCircleId = this.result.politicalBusinessResult.countingCircleId;

    await this.resultExportService.downloadResultBundleReviewExport(bundle.protocolExport!.protocolExportId, contestId, countingCircleId);
  }

  protected abstract deleteBundleById(bundleId: string): Promise<void>;

  protected abstract loadBundles(resultId: string, params: Params): Promise<T>;

  protected abstract loadBundle(id: string): Promise<TBundle>;

  protected abstract get politicalBusinessType(): PoliticalBusinessType;

  protected abstract get resultId(): string | undefined;

  protected abstract get watcherEventTypes(): EventType[];

  protected getUsedBundleNumbers(bundles: PoliticalBusinessResultBundle[]): number[] {
    return bundles.map(x => x.number);
  }

  protected getDeletedUnusedBundleNumbers(bundles: PoliticalBusinessResultBundle[]): number[] {
    const notDeletedBundleNumbers = bundles.filter(x => x.state !== BallotBundleState.BALLOT_BUNDLE_STATE_DELETED).map(x => x.number);
    return bundles
      .filter(x => x.state === BallotBundleState.BALLOT_BUNDLE_STATE_DELETED && !notDeletedBundleNumbers.includes(x.number))
      .map(x => x.number);
  }

  protected async handleBundleCreated(id: string): Promise<void> {
    if (this.bundlesById[id]) {
      return;
    }

    await this.reloadBundle(id);
  }

  protected setBundleState(id: string, state: BallotBundleState, log: PoliticalBusinessResultBundleLog): void {
    const bundle = this.bundlesById[id];
    if (!bundle) {
      return;
    }

    bundle.state = state;
    bundle.logs = [...bundle.logs, log];
    this.updateBundles();
  }

  protected adjustCountOfBallots(bundleId: string, delta: number): void {
    const bundle = this.bundlesById[bundleId];
    if (!!bundle) {
      bundle.countOfBallots += delta;
    }
  }

  protected async reloadBundle(id: string): Promise<void> {
    const bundle = await this.loadBundle(id);
    this.bundleCreatedOrUpdated(bundle);
  }

  protected async handleEvent(e: Event, params: Params): Promise<void> {
    switch (e.type) {
      case '_reconnectAttempt':
        const result = await this.loadBundles(params.resultId, params);
        for (const bundle of result.bundles) {
          this.bundleCreatedOrUpdated(bundle);
        }

        break;
      case 'ProtocolExportStarted':
        this.setProtocolExportState(
          this.bundlesById[e.politicalBusinessBundleId],
          ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING,
          e.entityId,
        );
        break;
      case 'ProtocolExportCompleted':
        this.setProtocolExportState(
          this.bundlesById[e.politicalBusinessBundleId],
          ProtocolExportState.PROTOCOL_EXPORT_STATE_COMPLETED,
          e.entityId,
        );
        break;
      case 'ProtocolExportFailed':
        this.setProtocolExportState(
          this.bundlesById[e.politicalBusinessBundleId],
          ProtocolExportState.PROTOCOL_EXPORT_STATE_FAILED,
          e.entityId,
        );
        break;
    }
  }

  private async loadData(params: Params): Promise<void> {
    this.loading = true;
    try {
      this.watchSubscription?.unsubscribe();
      delete this.watchSubscription;
      this.result = await this.loadBundles(params.resultId, params);

      this.bundlesById = groupBySingle(
        this.result.bundles,
        x => x.id,
        x => x,
      );

      this.resultReadOnly =
        this.result.politicalBusinessResult.politicalBusiness.contest!.locked ||
        (this.result.politicalBusinessResult.state !== CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING &&
          this.result.politicalBusinessResult.state !== CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION);

      if (!this.resultReadOnly) {
        this.watchSubscription = this.eventLogService
          .watch([...ProtocolEventTypes, ...this.watcherEventTypes], {
            contestId: this.result.politicalBusinessResult.politicalBusiness.contestId,
            politicalBusinessResultId: this.result.politicalBusinessResult.id,
          })
          .subscribe(e => this.handleEvent(e, params));
      }
    } finally {
      this.loading = false;
    }
  }

  private bundleCreatedOrUpdated(b: TBundle): void {
    if (!this.result) {
      return;
    }

    const bundle = this.bundlesById[b.id];
    if (!!bundle) {
      Object.assign(this.bundlesById[b.id], b);
      this.updateBundles();
      return;
    }

    this.bundlesById[b.id] = b;
    this.result.bundles.push(b);
    this.updateBundles();
  }

  private async confirmGenerationIfNeeded(protocolExport?: ProtocolExport): Promise<boolean> {
    if (
      !protocolExport ||
      (protocolExport.state !== ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING &&
        protocolExport.state !== ProtocolExportState.PROTOCOL_EXPORT_STATE_COMPLETED)
    ) {
      return true;
    }

    const i18nPrefix = 'EXPORTS.CONFIRM_GENERATE_AGAIN';
    const started = this.datePipe.transform(protocolExport.started, 'dd.MM.yyyy, HH:mm')!;
    const message = this.i18n.instant(`${i18nPrefix}.MESSAGE.${protocolExport.state}`, { started });
    return await this.dialog.confirm(`${i18nPrefix}.TITLE`, message, `${i18nPrefix}.CONFIRM`);
  }

  private updateBundles(): void {
    if (!this.result) {
      return;
    }

    this.result.bundles = [...this.result.bundles];
  }

  private setProtocolExportState(
    bundle: PoliticalBusinessResultBundle | undefined = undefined,
    state: ProtocolExportState | undefined = undefined,
    protocolExportId: string = '',
  ): void {
    if (!bundle) {
      return;
    }

    if (bundle.protocolExport) {
      if (state !== undefined) {
        bundle.protocolExport.state = state;
      }

      return;
    }

    bundle.protocolExport = {
      state: state ?? ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING,
      started: new Date(),
      fileName: '',
      exportTemplateId: '',
      protocolExportId,
      description: '',
      entityDescription: '',
    };
  }
}
