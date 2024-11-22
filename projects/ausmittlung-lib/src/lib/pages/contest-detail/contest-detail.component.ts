/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthorizationService, Tenant } from '@abraxas/base-components';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContestPoliticalBusinessDetailComponent } from '../../components/contest-detail/contest-political-business-detail/contest-political-business-detail.component';
import {
  MajorityElectionWriteInMappingDialogComponent,
  ResultImportWriteInMappingDialogData,
} from '../../components/majority-election-write-in-mappings/majority-election-write-in-mapping-dialog/majority-election-write-in-mapping-dialog.component';
import {
  ContestCountingCircleDetails,
  CountingCircle,
  CountingCircleResultState,
  DomainOfInfluenceType,
  ResultList,
  ResultListResult,
  VotingChannel,
} from '../../models';
import { BreadcrumbItem, BreadcrumbsService } from '../../services/breadcrumbs.service';
import { PoliticalBusinessResultService } from '../../services/political-business-result.service';
import { ResultService } from '../../services/result.service';
import { distinct, flatten, groupBySingle } from '../../services/utils/array.utils';
import { ResultImportService } from '../../services/result-import.service';
import { PermissionService } from '../../services/permission.service';
import { Permissions } from '../../models/permissions.model';
import {
  ContactDialogComponent,
  ContactDialogComponentData,
  ContactDialogResult,
} from '../../components/contact-dialog/contact-dialog.component';
import {
  ContestCountingCircleElectoratesUpdateDialogComponent,
  ContestCountingCircleElectoratesUpdateDialogData,
  ContestCountingCircleElectoratesUpdateDialogResult,
} from '../../components/contest-counting-circle-electorates-update-dialog/contest-counting-circle-electorates-update-dialog.component';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';
import { TranslateService } from '@ngx-translate/core';
import { ContestService } from '../../services/contest.service';

@Component({
  selector: 'vo-ausm-contest-detail',
  templateUrl: './contest-detail.component.html',
  styleUrls: ['./contest-detail.component.scss'],
})
export class ContestDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  public resultList?: ResultList;
  public loading: boolean = true;

  @Input()
  public contentReadonly: boolean = true;

  @Input()
  public showSetAllAuditedTentatively: boolean = false;

  @Input()
  public showResetResultsInTestingPhase: boolean = false;

  @Input()
  public showExport: boolean = true;

  public sidebarReadonly: boolean = true;

  public tenant?: Tenant;

  @ViewChildren(ContestPoliticalBusinessDetailComponent)
  public politicalBusinessesDetails?: QueryList<ContestPoliticalBusinessDetailComponent>;

  public countingMachineEnabled: boolean = false;
  public domainOfInfluenceTypes: DomainOfInfluenceType[] = [];
  public canton: DomainOfInfluenceCanton = DomainOfInfluenceCanton.DOMAIN_OF_INFLUENCE_CANTON_UNSPECIFIED;
  public accessibleCountingCircles: CountingCircle[] = [];

  public readonly breadcrumbs: BreadcrumbItem[];

  private readonly routeParamsSubscription: Subscription;
  private readonly routeQueryParamsSubscription: Subscription;
  private readonly routeDataSubscription: Subscription;
  private politicalBusinessesDetailsChangeSubscription?: Subscription;
  private stateChangesSubscription?: Subscription;
  private importChangesSubscription?: Subscription;
  private writeInChangesSubscription?: Subscription;

  private politicalBusinessIdToExpand?: string;
  private resultsById: Record<string, ResultListResult> = {};

  public canFinishSubmission: boolean = false;
  public canEditContactPerson: boolean = false;
  public canEditElectorates: boolean = false;
  public canMapWriteIns: boolean = false;
  public canEditCountingCircleDetails: boolean = false;
  private canReadWriteIns: boolean = false;

  constructor(
    breadcrumbsService: BreadcrumbsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly resultService: ResultService,
    private readonly resultImportService: ResultImportService,
    private readonly auth: AuthorizationService,
    private readonly cd: ChangeDetectorRef,
    private readonly dialogService: DialogService,
    private readonly politicalBusinessResultService: PoliticalBusinessResultService,
    private readonly permissionService: PermissionService,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
    private readonly contestService: ContestService,
  ) {
    this.breadcrumbs = breadcrumbsService.contestDetail;
    this.routeQueryParamsSubscription = this.route.queryParams.subscribe(({ politicalBusinessId }) =>
      this.tryExpandPoliticalBusinesses(politicalBusinessId),
    );
    this.routeParamsSubscription = this.route.params.subscribe(({ contestId, countingCircleId }) =>
      this.loadData(contestId, countingCircleId),
    );

    this.routeDataSubscription = route.data.subscribe(async ({ contestCantonDefaults }) => {
      this.countingMachineEnabled = contestCantonDefaults.countingMachineEnabled;
    });
  }

  public async ngOnInit(): Promise<void> {
    this.canFinishSubmission = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.FinishSubmission);
    this.canMapWriteIns = await this.permissionService.hasPermission(Permissions.MajorityElectionWriteIn.Update);
    this.canReadWriteIns = await this.permissionService.hasPermission(Permissions.MajorityElectionWriteIn.Read);
    this.canEditContactPerson = await this.permissionService.hasPermission(Permissions.CountingCircleContactPerson.Update);
    this.canEditElectorates = await this.permissionService.hasPermission(Permissions.ContestCountingCircleElectorate.Update);
    this.canEditCountingCircleDetails = await this.permissionService.hasPermission(Permissions.ContestCountingCircleDetails.Update);
  }

  public async mapWriteIns(): Promise<void> {
    if (
      this.contentReadonly ||
      !this.resultList ||
      !this.resultList.currentTenantIsResponsible ||
      this.resultList.contest.locked ||
      !this.resultList.contest.eVotingResultsImported ||
      !this.resultList.hasUnmappedEVotingWriteIns ||
      !this.canMapWriteIns
    ) {
      return;
    }

    const data: ResultImportWriteInMappingDialogData = {
      contestId: this.resultList.contest.id,
      countingCircleId: this.resultList.countingCircle.id,
    };

    const mapped = await this.dialogService.openForResult(MajorityElectionWriteInMappingDialogComponent, data);
    if (mapped) {
      this.resultList.hasUnmappedEVotingWriteIns = false;
    }
  }

  public async export(): Promise<void> {
    if (!this.resultList) {
      return;
    }

    await this.router.navigate(['exports'], { relativeTo: this.route });
  }

  public async finishSubmission(): Promise<void> {
    if (!this.resultList) {
      return;
    }

    await this.router.navigate(['finish-submission'], { relativeTo: this.route });
  }

  public ngAfterViewInit(): void {
    this.politicalBusinessesDetails?.notifyOnChanges();
    this.politicalBusinessesDetailsChangeSubscription = this.politicalBusinessesDetails?.changes.subscribe(() =>
      this.tryExpandPoliticalBusinesses(),
    );
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription?.unsubscribe();
    this.routeQueryParamsSubscription?.unsubscribe();
    this.politicalBusinessesDetailsChangeSubscription?.unsubscribe();
    this.stateChangesSubscription?.unsubscribe();
    this.importChangesSubscription?.unsubscribe();
    this.routeDataSubscription?.unsubscribe();
  }

  public updateCountOfVoters(newData: ContestCountingCircleDetails): void {
    const initialResultList = this.resultList?.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_INITIAL;
    this.politicalBusinessesDetails?.forEach(pb => {
      if (!initialResultList) {
        pb.countingCircleDetailsUpdated(newData);
      } else {
        pb.expanded = false;
        pb.result.state = CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING;
      }
    });

    if (initialResultList) {
      this.resultList!.state = CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING;
    }

    this.resultList!.details = newData;
  }

  private async onStateChangeListenerRetry(): Promise<void> {
    if (!this.stateChangesSubscription || !this.resultList?.contest?.id) {
      return;
    }

    // When the export state change listener fails, it is being retried with an exponential backoff
    // During that retry backoff, changes aren't being delivered -> we need to poll for them
    const data = await this.resultService.getList(this.resultList.contest.id, this.resultList.countingCircle.id);
    for (const result of data.results) {
      this.stateUpdated(result.id, result.state);
    }
  }

  private stateUpdated(resultId: string, newState: CountingCircleResultState): void {
    if (!this.resultList) {
      return;
    }

    const result = this.resultsById[resultId] || {};
    if (!result || result.state === newState) {
      return;
    }

    result.state = newState;

    switch (result.state) {
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING:
        result.submissionDoneTimestamp = undefined;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION:
        result.submissionDoneTimestamp = undefined;
        result.readyForCorrectionTimestamp = new Date();
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE:
        result.submissionDoneTimestamp = new Date();
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE:
        result.submissionDoneTimestamp = new Date();
        result.readyForCorrectionTimestamp = undefined;
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY:
        result.auditedTentativelyTimestamp = new Date();
        break;
      case CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED:
        result.plausibilisedTimestamp = new Date();
        break;
    }

    this.resultList.state = Math.min(...this.resultList.results.map(r => r.state));
    this.updateSidebarReadonly();
    this.politicalBusinessResultService.resultStateChanged(result.id, newState);
  }

  private async loadData(contestId: string, countingCircleId: string): Promise<void> {
    this.loading = true;
    try {
      [this.accessibleCountingCircles, this.resultList] = await Promise.all([
        this.contestService.getAccessibleCountingCircles(contestId),
        await this.resultService.getList(contestId, countingCircleId),
      ]);

      if (this.resultList.mustUpdateContactPersons && this.canEditContactPerson) {
        await this.openContactDialog(false);
      }

      this.domainOfInfluenceTypes = distinct(
        this.resultList.results.map(r => r.politicalBusiness.domainOfInfluence!.type),
        x => x,
      );

      if (this.resultList.results.length > 0) {
        this.canton = this.resultList.results[0].politicalBusiness.domainOfInfluence!.canton;
      }

      this.updateSidebarReadonly();
      this.tenant = await this.auth.getActiveTenant();
      this.tryExpandPoliticalBusinesses();
      this.mapWriteIns();
      this.resultsById = groupBySingle(
        this.resultList.results,
        x => x.id,
        x => x,
      );
      this.startChangesListener();

      // detect changes to make sure that all components are visible
      this.cd.detectChanges();
    } finally {
      this.loading = false;
    }
  }

  private tryExpandPoliticalBusinesses(newId?: string): void {
    if (newId) {
      this.politicalBusinessIdToExpand = newId;
    } else if (!this.politicalBusinessIdToExpand) {
      return;
    }

    const expandable = this.politicalBusinessesDetails?.find(x => x.result.politicalBusiness.id === this.politicalBusinessIdToExpand);
    if (expandable) {
      expandable.expanded = true;
      delete this.politicalBusinessIdToExpand;
      this.cd.detectChanges();
    }
  }

  private updateSidebarReadonly(): void {
    if (!this.resultList || this.resultList.contest.locked) {
      this.sidebarReadonly = true;
      return;
    }

    const maxResultListState = Math.max(
      ...this.resultList.results.map(l => l.state),
      CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_INITIAL,
    );
    this.sidebarReadonly = maxResultListState >= CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE;
  }

  private startChangesListener(): void {
    if (!this.resultList || !this.resultList.contest) {
      return;
    }

    this.stateChangesSubscription?.unsubscribe();
    this.stateChangesSubscription = this.resultService
      .getStateChanges(this.resultList.contest.id, this.onStateChangeListenerRetry.bind(this))
      .subscribe(({ id, newState }) => this.stateUpdated(id, newState));

    if (this.canMapWriteIns && this.resultList.details.eVoting) {
      this.importChangesSubscription?.unsubscribe();
      this.importChangesSubscription = this.resultImportService
        .getImportChanges(this.resultList.contest.id, this.resultList.countingCircle.id)
        .subscribe(({ hasWriteIns }) => this.importUpdated(hasWriteIns));
    }

    if (this.canReadWriteIns && this.resultList.details.eVoting) {
      this.writeInChangesSubscription?.unsubscribe();
      this.writeInChangesSubscription = this.resultImportService
        .getWriteInMappingChanges(this.resultList.contest.id, this.resultList.countingCircle.id)
        .subscribe(change =>
          this.writeInMappingsUpdated(change.resultId, change.isReset, change.duplicatedCandidates, change.invalidDueToEmptyBallot),
        );
    }
  }

  private async importUpdated(hasWriteIns: boolean): Promise<void> {
    if (!this.resultList) {
      return;
    }

    const title = 'RESULT_IMPORT.IMPORTED.TITLE';
    if (!hasWriteIns) {
      await this.dialogService.alert(title, 'RESULT_IMPORT.IMPORTED.TEXT_WITHOUT_WRITE_INS', 'APP.CONFIRM');
      return;
    }

    const confirmed = await this.dialogService.confirm(
      title,
      'RESULT_IMPORT.IMPORTED.TEXT_WITH_WRITE_INS',
      'RESULT_IMPORT.IMPORTED.ACTION_WRITE_INS',
    );

    if (!confirmed) {
      return;
    }

    // update result list after import with new values and write ins
    this.resultList = await this.resultService.getList(this.resultList.contest.id, this.resultList.countingCircle.id);

    await this.mapWriteIns();
  }

  private async writeInMappingsUpdated(
    resultId: string,
    isReset: boolean,
    duplicatedCandidates: number,
    invalidDueToEmptyBallot: number,
  ): Promise<void> {
    if (!this.resultList) {
      return;
    }

    // update result list with the updated write in mappings
    this.resultList = await this.resultService.getList(this.resultList.contest.id, this.resultList.countingCircle.id);

    const result = this.resultList?.results.find(r => r.id === resultId);
    if (!result) {
      return;
    }

    if (isReset) {
      this.toast.success(this.i18n.instant('RESULT_IMPORT.WRITE_INS.RESETTED'));
      return;
    }

    let message = this.i18n.instant('RESULT_IMPORT.WRITE_INS.MAPPED_FOR', { election: result.politicalBusiness.shortDescription });
    if (duplicatedCandidates === 0 && invalidDueToEmptyBallot === 0) {
      this.toast.success(message);
      return;
    }

    if (duplicatedCandidates > 0) {
      message += '\n' + this.i18n.instant('RESULT_IMPORT.WRITE_INS.MAPPED_DUPLICATED_CANDIDATES', { count: duplicatedCandidates });
    }

    if (invalidDueToEmptyBallot > 0) {
      message += '\n' + this.i18n.instant('RESULT_IMPORT.WRITE_INS.MAPPED_INVALID_DUE_TO_EMPTY_BALLOT', { count: invalidDueToEmptyBallot });
    }

    await this.dialogService.alert('RESULT_IMPORT.WRITE_INS.MAPPED', message);
  }

  public async openContactDialog(showCancel: boolean = true): Promise<void> {
    if (!this.resultList || this.resultList?.results.length === 0) {
      return;
    }

    const data: ContactDialogComponentData = {
      domainOfInfluences: distinct(
        this.resultList.results.map(x => x.politicalBusiness.domainOfInfluence!),
        x => x.id,
      ),
      resultList: this.resultList,
      readonly: !this.resultList.currentTenantIsResponsible || !this.canEditContactPerson || this.resultList.contest.locked,
      showCancel,
      tenantId: this.tenant!.id,
    };

    const dialogResult = await this.dialogService.openForResult<ContactDialogComponent, ContactDialogResult>(ContactDialogComponent, data, {
      disableClose: !showCancel,
    });

    if (dialogResult) {
      this.resultList = dialogResult.resultList;
    }
  }

  public async openElectoratesDialog(): Promise<void> {
    if (!this.resultList || !this.resultList.electorateSummary || !this.canEditElectorates) {
      return;
    }

    const data: ContestCountingCircleElectoratesUpdateDialogData = {
      contestId: this.resultList.contest.id,
      countingCircleId: this.resultList.countingCircle.id,
      readonly: this.resultList.contest.locked,
      electorates: this.resultList.electorateSummary.contestCountingCircleElectoratesList,
    };

    const result = await this.dialogService.openForResult<
      ContestCountingCircleElectoratesUpdateDialogComponent,
      ContestCountingCircleElectoratesUpdateDialogResult
    >(ContestCountingCircleElectoratesUpdateDialogComponent, data);

    if (!result) {
      return;
    }

    for (const vc of this.resultList.details.votingCards.filter(vc => vc.channel !== VotingChannel.VOTING_CHANNEL_E_VOTING)) {
      vc.countOfReceivedVotingCards = undefined;
    }

    this.resultList.electorateSummary.contestCountingCircleElectoratesList = result.electorates;
    this.resultList.electorateSummary.effectiveElectoratesList = [];

    for (const electorate of result.electorates) {
      const doiTypes = electorate.domainOfInfluenceTypesList.filter(doiType => this.domainOfInfluenceTypes.includes(doiType));
      if (doiTypes.length > 0) {
        this.resultList.electorateSummary.effectiveElectoratesList.push({
          domainOfInfluenceTypesList: doiTypes,
        });
      }
    }

    const effectiveDoiTypes = flatten(this.resultList.electorateSummary.effectiveElectoratesList.map(e => e.domainOfInfluenceTypesList));
    const requiredUnusedDoiTypes = this.domainOfInfluenceTypes.filter(doiType => !effectiveDoiTypes.includes(doiType));

    if (requiredUnusedDoiTypes.length > 0) {
      this.resultList.electorateSummary.effectiveElectoratesList.push({
        domainOfInfluenceTypesList: requiredUnusedDoiTypes,
      });
    }

    // ascending sort by the first doi type of a electorate.
    this.resultList.electorateSummary.effectiveElectoratesList.sort(
      (a, b) => a.domainOfInfluenceTypesList[0] - b.domainOfInfluenceTypesList[0],
    );

    // trigger cd
    this.resultList.details.votingCards = [...this.resultList.details.votingCards];
  }
}
