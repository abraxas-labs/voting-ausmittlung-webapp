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
import { Observable, Subscription } from 'rxjs';
import { ShortcutDialogComponent, ShortcutDialogData } from '../../components/ballot-shortcut-dialog/shortcut-dialog.component';
import {
  MajorityElectionResultBundles,
  PoliticalBusinessResultBundle,
  ProportionalElectionResultBundle,
  ProportionalElectionResultBundles,
  ProtocolExport,
  ProtocolExportStateChange,
  VoteResultBundles,
} from '../../models';
import { ResultExportService } from '../../services/result-export.service';
import { PermissionService } from '../../services/permission.service';
import { groupBy, groupBySingle } from '../../services/utils/array.utils';
import { Permissions } from '../../models/permissions.model';
import { ExportService } from '../../services/export.service';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';
import { DatePipe } from '@angular/common';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';

@Directive()
export abstract class PoliticalBusinessBundleOverviewComponent<
    T extends ProportionalElectionResultBundles | MajorityElectionResultBundles | VoteResultBundles,
  >
  implements OnInit, OnDestroy
{
  public result?: T;
  public resultReadOnly: boolean = true;
  public loading: boolean = true;
  public canCreateBundle: boolean = false;

  public openBundles: PoliticalBusinessResultBundle[] | ProportionalElectionResultBundle[] = [];
  public reviewedBundles: PoliticalBusinessResultBundle[] | ProportionalElectionResultBundle[] = [];
  public deletedBundles: PoliticalBusinessResultBundle[] | ProportionalElectionResultBundle[] = [];

  private bundlesById: Record<string, PoliticalBusinessResultBundle | ProportionalElectionResultBundle> = {};

  private routeParamsSubscription?: Subscription;
  private bundleStateChangesSubscription?: Subscription;
  private stateChangesSubscription?: Subscription;

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
    private readonly datePipe: DatePipe,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.routeParamsSubscription = this.route.params.subscribe(params => this.loadData(params));
    this.canCreateBundle = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBundle.Create);
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription?.unsubscribe();
    this.bundleStateChangesSubscription?.unsubscribe();
    this.stateChangesSubscription?.unsubscribe();
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

    const oldState = bundle.state;
    bundle.state = BallotBundleState.BALLOT_BUNDLE_STATE_DELETED;
    this.moveBundle(bundle, oldState);
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
    bundle.protocolExport = {
      state: ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING,
      started: new Date(),
      fileName: '',
      exportTemplateId: '',
      protocolExportId: '',
      description: '',
      entityDescription: '',
    };

    bundle.protocolExport.protocolExportId = await this.exportService.startBundleReviewExport(bundle.id, this.politicalBusinessType);
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

  protected abstract get politicalBusinessType(): PoliticalBusinessType;

  protected abstract get resultId(): string | undefined;

  protected abstract startChangesListener(
    resultId: string,
    params: Params,
    onRetry: () => {},
  ): Observable<PoliticalBusinessResultBundle | ProportionalElectionResultBundle>;

  protected getUsedBundleNumbers(bundles: PoliticalBusinessResultBundle[]): number[] {
    return bundles.map(x => x.number);
  }

  protected getDeletedUnusedBundleNumbers(bundles: PoliticalBusinessResultBundle[]): number[] {
    const notDeletedBundleNumbers = bundles.filter(x => x.state !== BallotBundleState.BALLOT_BUNDLE_STATE_DELETED).map(x => x.number);
    return bundles
      .filter(x => x.state === BallotBundleState.BALLOT_BUNDLE_STATE_DELETED && !notDeletedBundleNumbers.includes(x.number))
      .map(x => x.number);
  }

  private async loadData(params: Params): Promise<void> {
    this.loading = true;
    try {
      this.bundleStateChangesSubscription?.unsubscribe();
      this.stateChangesSubscription?.unsubscribe();
      this.result = await this.loadBundles(params.resultId, params);

      this.bundlesById = groupBySingle(
        this.result.bundles,
        x => x.id,
        x => x,
      );
      this.updateBundleGroups();

      this.resultReadOnly =
        this.result.politicalBusinessResult.politicalBusiness.contest!.locked ||
        (this.result.politicalBusinessResult.state !== CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING &&
          this.result.politicalBusinessResult.state !== CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION);

      if (!this.resultReadOnly) {
        this.bundleStateChangesSubscription = this.startChangesListener(
          params.resultId,
          params,
          this.onChangesListenerRetry.bind(this, params),
        ).subscribe(x => this.bundleUpdated(x));

        if (!this.resultId) {
          return;
        }

        this.stateChangesSubscription = this.exportService
          .getBundleReviewExportStateChanges(
            this.resultId,
            this.politicalBusinessType,
            this.onBundleReviewExportStateChangeListenerRetry.bind(this, params),
          )
          .subscribe(changed => this.bundleReviewExportStateChanged(changed));
      }
    } finally {
      this.loading = false;
    }
  }

  private async onChangesListenerRetry(params: Params): Promise<void> {
    if (!this.bundleStateChangesSubscription) {
      return;
    }

    // When the change listener fails, it is being retried with an exponential backoff
    // During that retry backoff, changes aren't being delivered -> we need to poll for them
    const result = await this.loadBundles(params.resultId, params);
    for (const bundle of result.bundles) {
      this.bundleUpdated(bundle);
    }
  }

  private bundleUpdated(b: PoliticalBusinessResultBundle | ProportionalElectionResultBundle): void {
    if (!this.result) {
      return;
    }

    const bundle = this.bundlesById[b.id];
    if (!!bundle) {
      if (bundle.state === b.state) {
        // Nothing got updated, probably a "synthetic change" from a polling attempt
        return;
      }

      const oldState = bundle.state;
      Object.assign(this.bundlesById[b.id], b);
      this.moveBundle(b, oldState);
      return;
    }

    this.bundlesById[b.id] = b;
    this.result.bundles.push(b);
    this.moveBundle(b);
  }

  private updateBundleGroups(): void {
    if (!this.result) {
      return;
    }

    const grouped = groupBy(
      this.result.bundles,
      x => x.state,
      x => x,
    );
    this.openBundles = [
      ...(grouped[BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW] || []),
      ...(grouped[BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION] || []),
      ...(grouped[BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS] || []),
    ];
    this.reviewedBundles = grouped[BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED] || [];
    this.deletedBundles = grouped[BallotBundleState.BALLOT_BUNDLE_STATE_DELETED] || [];
  }

  private moveBundle(bundle: PoliticalBusinessResultBundle, oldState?: BallotBundleState): void {
    if (oldState === BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED) {
      this.reviewedBundles = this.reviewedBundles.filter(x => x.id !== bundle.id);
    } else if (oldState !== undefined) {
      this.openBundles = this.openBundles.filter(x => x.id !== bundle.id);
    }

    switch (bundle.state) {
      case BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED:
        this.reviewedBundles = [bundle, ...this.reviewedBundles.filter(b => b.id !== bundle.id)];
        break;
      case BallotBundleState.BALLOT_BUNDLE_STATE_DELETED:
        this.deletedBundles = [bundle, ...this.deletedBundles.filter(b => b.id !== bundle.id)];
        break;
      default:
        this.openBundles = [bundle, ...this.openBundles.filter(b => b.id !== bundle.id)].sort((a, b) => this.sortOpenBundles(a, b));
        break;
    }
  }

  private sortOpenBundles(a: PoliticalBusinessResultBundle, b: PoliticalBusinessResultBundle): number {
    const diff = this.getOpenBundleOrderNumber(a.state) - this.getOpenBundleOrderNumber(b.state);
    if (diff !== 0) {
      return diff;
    }

    return a.number - b.number;
  }

  private getOpenBundleOrderNumber(state: BallotBundleState): number {
    if (state === BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW) {
      return 0;
    }

    if (state === BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION) {
      return 1;
    }

    if (state === BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS) {
      return 2;
    }

    throw new Error('Bad bundle state parameter');
  }

  private bundleReviewExportStateChanged(changed: ProtocolExportStateChange): void {
    const bundle = this.openBundles.find(t => t.protocolExport?.protocolExportId === changed.protocolExportId);

    if (!bundle || !bundle.protocolExport) {
      return;
    }

    bundle.protocolExport.state = changed.newState;
    bundle.protocolExport.started = changed.started;
    bundle.protocolExport.fileName = changed.fileName;
  }

  private async onBundleReviewExportStateChangeListenerRetry(params: Params): Promise<void> {
    if (!this.stateChangesSubscription || !this.result) {
      return;
    }

    // When the change listener fails, it is being retried with an exponential backoff
    // During that retry backoff, changes aren't being delivered -> we need to poll for them
    const result = await this.loadBundles(params.resultId, params);
    for (const bundle of result.bundles) {
      if (!bundle.protocolExport) {
        continue;
      }

      const syntheticStateChange: ProtocolExportStateChange = {
        exportTemplateId: bundle.protocolExport.exportTemplateId,
        protocolExportId: bundle.protocolExport.protocolExportId,
        newState: bundle.protocolExport.state,
        started: bundle.protocolExport.started,
        fileName: bundle.protocolExport.fileName,
      };
      this.bundleReviewExportStateChanged(syntheticStateChange);
    }
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
}
