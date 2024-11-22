/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Directive, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import {
  MajorityElectionResult,
  PoliticalBusinessResultBallot,
  PoliticalBusinessResultBundle,
  ProportionalElectionResult,
  VoteResult,
} from '../../models';
import { PermissionService } from '../../services/permission.service';
import { UserService } from '../../services/user.service';
import { Permissions } from '../../models/permissions.model';
import { HasUnsavedChanges } from '../../services/guards/has-unsaved-changes.guard';

@Directive()
export abstract class PoliticalBusinessBallotComponent<
    TResult extends ProportionalElectionResult | MajorityElectionResult | VoteResult,
    TBundle extends PoliticalBusinessResultBundle,
    TBallot extends PoliticalBusinessResultBallot,
  >
  implements OnInit, OnDestroy, HasUnsavedChanges
{
  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  public static readonly newId: string = 'new';

  public loading: boolean = true;
  public loadingBallot: boolean = false;
  public actionExecuting: boolean = false;

  public hasChanges: boolean = false;
  public politicalBusinessResult?: TResult;
  public bundle?: TBundle;
  public ballot?: TBallot;

  public minBallotNumber: number = 0;
  public currentMaxBallotNumber: number = 0;
  public bundleInProcessOrCorrection: boolean = false;

  public canSubmitBundle: boolean = false;
  public canUpdateBallot: boolean = false;

  private routeParamsSubscription: Subscription = Subscription.EMPTY;

  protected constructor(
    protected readonly userService: UserService,
    protected readonly route: ActivatedRoute,
    protected readonly dialog: DialogService,
    protected readonly i18n: TranslateService,
    private readonly router: Router,
    private readonly toast: SnackbarService,
    private readonly permissionService: PermissionService,
  ) {}

  protected abstract get deletedBallotLabel(): string;

  public async ngOnInit(): Promise<void> {
    this.routeParamsSubscription = this.route.params.subscribe(params => this.loadOrCreate(params));
    this.canSubmitBundle = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBundle.FinishSubmission);
    this.canUpdateBallot = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBallot.Update);
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  public get hasUnsavedChanges(): boolean {
    return this.hasChanges;
  }

  public async navigateToBallot(ballotNr: number): Promise<void> {
    if (!this.bundle || ballotNr === this.ballot?.number) {
      return;
    }

    try {
      this.loadingBallot = true;
      if (!(await this.saveBallot())) {
        return;
      }
      await this.loadData(this.bundle.id, ballotNr);
      await this.router.navigate(['..', ballotNr], { relativeTo: this.route });
    } finally {
      this.loadingBallot = false;
    }
  }

  public async nextBallot(): Promise<void> {
    if (!this.ballot || this.ballot.isNew || this.ballot.number === this.currentMaxBallotNumber) {
      await this.createBallot();
      return;
    }

    await this.navigateToBallot(this.ballot.number + 1);
  }

  public async saveAndBack(): Promise<void> {
    if (!this.bundleInProcessOrCorrection) {
      return await this.navigateBack();
    }

    this.actionExecuting = true;
    try {
      if (!(await this.saveBallot())) {
        return;
      }
      await this.navigateBack();
    } finally {
      this.actionExecuting = false;
    }
  }

  protected async createBallot(): Promise<void> {
    if (!this.bundle || !this.politicalBusinessResult) {
      return;
    }

    // loadingBallot is set to activate the spinner so that the focus can be set afterwards.
    this.loadingBallot = true;
    this.actionExecuting = true;
    try {
      // save current ballot
      if (!(await this.saveBallot())) {
        return;
      }

      this.bundle.countOfBallots++;
      this.currentMaxBallotNumber++;
      this.ballot = await this.createNewBallot();
      await this.router.navigate(['..', this.ballot.number], { relativeTo: this.route });
      this.hasChanges = true;
    } finally {
      this.loadingBallot = false;
      this.actionExecuting = false;
    }

    // setTimeout is needed to make sure all components are visible
    setTimeout(() => this.setFocus());
  }

  public async deleteBallotAndNavigate(): Promise<void> {
    if (!this.bundle || !this.ballot) {
      return;
    }

    this.actionExecuting = true;
    try {
      if (!this.ballot.isNew) {
        await this.deleteBallot(this.bundle.id, this.ballot.number);
      }

      this.bundle.countOfBallots--;
      this.currentMaxBallotNumber--;
      this.toast.success(this.i18n.instant(this.deletedBallotLabel));
      this.hasChanges = false;
      if (this.bundle.countOfBallots === 0) {
        delete this.ballot;
        await this.navigateToBallot(0);
        return;
      }

      const prevNumber = this.ballot.number - 1;
      delete this.ballot;
      await this.navigateToBallot(prevNumber);
    } finally {
      this.actionExecuting = false;
    }
  }

  public async submitBundleAndNavigate(): Promise<void> {
    if (!this.bundle || !this.politicalBusinessResult || !(await this.saveBallot())) {
      return;
    }

    this.actionExecuting = true;
    try {
      await this.submitBundle(this.bundle.id, this.bundle.state);
      await this.navigateBack();
    } finally {
      this.actionExecuting = false;
    }
  }

  protected abstract createNewBallot(): Promise<TBallot>;

  protected abstract saveNewBallot(bundle: TBundle, ballot: TBallot): Promise<number>;

  protected abstract updateBallot(bundle: TBundle, ballot: TBallot): Promise<void>;

  protected abstract deleteBallot(bundleId: string, ballotNumber: number): Promise<void>;

  protected abstract submitBundle(bundleId: string, state: BallotBundleState): Promise<void>;

  protected abstract reconstructData(resultId: string, bundleId: string, params: Params): Promise<void>;

  protected abstract loadBundleData(bundleId: string): Promise<void>;

  protected abstract loadBallotData(bundleId: string, ballotNumber: number): Promise<void>;

  protected abstract validateBallot(): Promise<boolean>;

  protected abstract setFocus(): void;

  protected computeBundleData(): void {
    if (!this.politicalBusinessResult || !this.bundle) {
      return;
    }

    this.bundleInProcessOrCorrection =
      this.bundle.state === BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS ||
      this.bundle.state === BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION;
    this.currentMaxBallotNumber = this.minBallotNumber + this.bundle.countOfBallots - 1;
  }

  protected async saveBallot(): Promise<boolean> {
    if (!this.hasChanges) {
      return true;
    }

    if (!this.bundle || !this.ballot || !this.politicalBusinessResult) {
      return false;
    }

    if (!(await this.validateBallot())) {
      return false;
    }

    if (this.ballot.isNew) {
      this.ballot.number = await this.saveNewBallot(this.bundle, this.ballot);
      this.ballot.isNew = false;
    } else {
      await this.updateBallot(this.bundle, this.ballot);
    }

    this.toast.success(this.i18n.instant('APP.SAVED'));
    this.hasChanges = false;
    return true;
  }

  private async loadOrCreate(params: Params): Promise<void> {
    if (params.ballotNumber === PoliticalBusinessBallotComponent.newId) {
      await this.reconstructDataAndCreateNew(params.resultId, params.bundleId, params);
      return;
    }

    await this.loadData(params.bundleId, +params.ballotNumber);
  }

  private async reconstructDataAndCreateNew(resultId: string, bundleId: string, params: Params): Promise<void> {
    try {
      // recreate information since it is likely that the event is not yet processed by the backend
      await this.reconstructData(resultId, bundleId, params);
      await this.createBallot();
    } finally {
      this.loading = false;
      this.loadingBallot = false;
    }
  }

  private async loadData(bundleId: string, ballotNumber?: number): Promise<void> {
    const bundleChanged = await this.loadBundle(bundleId);
    const ballotChanged = bundleChanged || !this.ballot || this.ballot.number !== ballotNumber;
    if (!ballotChanged) {
      return;
    }

    if (ballotNumber) {
      await this.loadBallot(bundleId, ballotNumber);
      return;
    }

    if (this.bundle!.countOfBallots > 0) {
      await this.navigateToBallot(this.minBallotNumber);
    }
  }

  private async loadBundle(bundleId: string): Promise<boolean> {
    const bundleChanged = !this.bundle || this.bundle.id !== bundleId;
    if (!bundleChanged) {
      return false;
    }

    this.loading = true;
    try {
      await this.loadBundleData(bundleId);
      this.computeBundleData();
    } finally {
      this.loading = false;
    }
    return true;
  }

  private async loadBallot(bundleId: string, ballotNumber: number): Promise<void> {
    this.loadingBallot = true;
    try {
      await this.loadBallotData(bundleId, ballotNumber);
      this.hasChanges = false;
    } finally {
      this.loadingBallot = false;
    }
  }

  private async navigateBack(): Promise<void> {
    await this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
