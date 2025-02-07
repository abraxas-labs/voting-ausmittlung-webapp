/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthorizationService, Tenant } from '@abraxas/base-components';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ContestCountingCircleDetails, ResultList, ResultListResult, VotingChannel } from '../../../models';
import { MajorityElectionResultService } from '../../../services/majority-election-result.service';
import { PoliticalBusinessResultService } from '../../../services/political-business-result.service';
import { ProportionalElectionResultService } from '../../../services/proportional-election-result.service';
import { ResultService } from '../../../services/result.service';
import { groupBy } from '../../../services/utils/array.utils';
import { VoteResultService } from '../../../services/vote-result.service';
import { PermissionService } from '../../../services/permission.service';
import { Permissions } from '../../../models/permissions.model';

@Component({
  selector: 'vo-ausm-contest-state-change-button',
  templateUrl: './contest-state-change-button.component.html',
  styleUrls: ['./contest-state-change-button.component.scss'],
})
export class ContestStateChangeButtonComponent implements OnDestroy, OnChanges, OnInit {
  @Input()
  public contentReadonly: boolean = false;

  @Input()
  public resultList!: ResultList;

  @Input()
  public showSetAllAuditedTentatively: boolean = false;

  @Input()
  public showResetResultsInTestingPhase: boolean = false;

  @Input()
  public buttonText: string = 'CONTEST.DETAIL.STATE_ACTION.LABEL';

  @Input()
  public stateDescriptionsByState: Record<number, string> = {};

  @Output()
  public finishSubmission: EventEmitter<void> = new EventEmitter<void>();

  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;

  public isActionExecuting: boolean = false;
  public canSetAllToAuditedTentatively: boolean = false;
  public canResetResultsInTestingPhase: boolean = false;

  public canResetResults: boolean = false;
  public canFinishSubmission: boolean = false;

  private readonly resultStateChangedSubscription: Subscription;
  private tenant?: Tenant;

  constructor(
    private readonly voteResultService: VoteResultService,
    private readonly proportionalElectionResultService: ProportionalElectionResultService,
    private readonly majorityElectionResultService: MajorityElectionResultService,
    private readonly politicalBusinessResultService: PoliticalBusinessResultService,
    private readonly resultService: ResultService,
    private readonly auth: AuthorizationService,
    private readonly permissionService: PermissionService,
  ) {
    this.resultStateChangedSubscription = politicalBusinessResultService.resultStateChanged$.subscribe(() => this.updateCanSetState());
  }

  public async ngOnInit(): Promise<void> {
    this.tenant = await this.auth.getActiveTenant();
    this.canResetResults = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.ResetResults);
    this.canFinishSubmission = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.FinishSubmission);
    this.updateCanSetState();
  }

  public async ngOnChanges(): Promise<void> {
    this.updateCanSetState();
  }

  public ngOnDestroy(): void {
    this.resultStateChangedSubscription.unsubscribe();
  }

  public async executeStateUpdate(newState: CountingCircleResultState, results: ResultListResult[]): Promise<void> {
    const byBusinessType = groupBy(
      results,
      x => x.politicalBusiness.businessType,
      x => x.id,
    );

    if (newState === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY) {
      await this.auditedTentatively(
        byBusinessType[PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE] || [],
        byBusinessType[PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION] || [],
        byBusinessType[PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION] || [],
      );
    }

    for (const result of results) {
      result.state = newState;
      this.politicalBusinessResultService.resultStateChanged(result.id, newState);
    }
  }

  public async setAllResponsibleAuditedTentatively(): Promise<void> {
    // only use results which the current tenant is responsible
    const results = this.resultList.results.filter(x => this.tenant?.id === x.politicalBusiness.domainOfInfluence?.secureConnectId);
    await this.executeStateUpdate(CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY, results);
  }

  public async resetResults(): Promise<void> {
    try {
      this.isActionExecuting = true;
      await this.resultService.resetCountingCircleResults(this.resultList.contest.id, this.resultList.countingCircle.id);
      await this.executeStateUpdate(CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING, this.resultList.results);
      this.resetDetails(this.resultList.details);
      this.updateCanResetResultsInTestingPhase();
    } finally {
      this.isActionExecuting = false;
    }
  }

  private async auditedTentatively(
    voteResultIds: string[],
    proportionalElectionResultIds: string[],
    majorityElectionResultIds: string[],
  ): Promise<void> {
    try {
      this.isActionExecuting = true;
      if (voteResultIds.length !== 0) {
        await this.voteResultService.auditedTentatively(voteResultIds);
      }

      if (proportionalElectionResultIds.length !== 0) {
        await this.proportionalElectionResultService.auditedTentatively(proportionalElectionResultIds);
      }

      if (majorityElectionResultIds.length !== 0) {
        await this.majorityElectionResultService.auditedTentatively(majorityElectionResultIds);
      }
    } finally {
      this.isActionExecuting = false;
    }
  }

  private updateCanSetState(): void {
    this.updateCanSetAllToAuditedTentatively();
    this.updateCanResetResultsInTestingPhase();
  }

  private updateCanSetAllToAuditedTentatively(): void {
    if (!this.resultList || !this.tenant) {
      return;
    }

    const owned = this.resultList.results.filter(x => this.tenant?.id === x.politicalBusiness.domainOfInfluence?.secureConnectId);

    this.canSetAllToAuditedTentatively =
      owned.length > 0 &&
      owned.every(
        x =>
          x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
          x.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE,
      );
  }

  private updateCanResetResultsInTestingPhase(): void {
    this.canResetResultsInTestingPhase =
      this.canResetResults &&
      this.resultList.currentTenantIsResponsible &&
      !this.resultList.contest.testingPhaseEnded &&
      !this.resultList.results.find(
        r =>
          r.state < CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING ||
          r.state >= CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY,
      ) &&
      !!this.resultList.details.countOfVotersInformation.subTotalInfoList.find(r => r.countOfVoters !== undefined);
  }

  private resetDetails(details: ContestCountingCircleDetails): void {
    for (const vc of details.votingCards.filter(x => x.channel !== VotingChannel.VOTING_CHANNEL_E_VOTING)) {
      delete vc.countOfReceivedVotingCards;
    }

    for (const subTotalInfo of details.countOfVotersInformation.subTotalInfoList) {
      delete subTotalInfo.countOfVoters;
    }

    details.countOfVotersInformation.totalCountOfVoters = 0;

    // trigger cd
    details.votingCards = [...details.votingCards];
    details.countOfVotersInformation = { ...details.countOfVotersInformation };
  }
}
