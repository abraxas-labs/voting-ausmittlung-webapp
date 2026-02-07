/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CountOfVotersInformationSubTotal,
  DomainOfInfluenceType,
  VoterType,
  VotingCardChannel,
  VotingCardResultDetail,
} from '../../../models';
import { CountingMachine } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/counting_machine_pb';
import { DialogService, EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';
import { ContestCountingCircleElectorateSummary } from '../../../models/contest-counting-circle-electorate.model';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';
import { cloneDeep, isEqual } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vo-ausm-contest-detail-info-dialog',
  templateUrl: './contest-detail-info-dialog.component.html',
  styleUrls: ['./contest-detail-info-dialog.component.scss'],
  standalone: false,
})
export class ContestDetailInfoDialogComponent implements OnDestroy {
  private readonly dialogRef = inject<MatDialogRef<ContestDetailInfoDialogData, ContestDetailInfoDialogResult>>(MatDialogRef);
  private readonly dialogService = inject(DialogService);
  private readonly i18n = inject(TranslateService);

  public readonly countingMachines: EnumItemDescription<CountingMachine>[] = [];

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  @HostListener('window:keyup.esc')
  public async keyUpEscape(): Promise<void> {
    await this.closeWithUnsavedChangesCheck();
  }

  public readonly: boolean;
  public domainOfInfluenceTypes: DomainOfInfluenceType[];
  public countingMachineEnabled: boolean;
  public eVoting: boolean;
  public enabledVoterTypes: VoterType[];
  public countOfVotersInformationSubTotals: CountOfVotersInformationSubTotal[];
  public votingCards: VotingCardResultDetail[];
  public enabledVotingCardChannels: VotingCardChannel[];
  public countingMachine: CountingMachine;
  public canton: DomainOfInfluenceCanton;
  public contestId?: string;
  public countingCircleId?: string;
  public electorateSummary?: ContestCountingCircleElectorateSummary;

  public hasChanges: boolean = false;
  public originalVotingCards: VotingCardResultDetail[];
  public originalCountOfVotersInformationSubTotals: CountOfVotersInformationSubTotal[];
  public originalCountingMachine: CountingMachine;

  public readonly backdropClickSubscription: Subscription;

  constructor() {
    const dialogData = inject<ContestDetailInfoDialogData>(MAT_DIALOG_DATA);
    const enumUtil = inject(EnumUtil);

    this.readonly = dialogData.readonly;
    this.domainOfInfluenceTypes = dialogData.domainOfInfluenceTypes;
    this.countingMachineEnabled = dialogData.countingMachineEnabled;
    this.eVoting = dialogData.eVoting;
    this.enabledVoterTypes = dialogData.enabledVoterTypes;
    this.countOfVotersInformationSubTotals = cloneDeep(dialogData.countOfVotersInformationSubTotals);
    this.votingCards = dialogData.votingCards;
    this.enabledVotingCardChannels = dialogData.enabledVotingCardChannels;
    this.countingMachine = dialogData.countingMachine;
    this.canton = dialogData.canton;
    this.contestId = dialogData.contestId;
    this.countingCircleId = dialogData.countingCircleId;
    this.electorateSummary = dialogData.electorateSummary;
    this.countingMachines = enumUtil.getArrayWithDescriptions<CountingMachine>(CountingMachine, 'COUNTING_MACHINES.');

    this.originalVotingCards = cloneDeep(this.votingCards);
    this.originalCountOfVotersInformationSubTotals = cloneDeep(this.countOfVotersInformationSubTotals);
    this.originalCountingMachine = cloneDeep(this.countingMachine);

    this.dialogRef.disableClose = true;
    this.backdropClickSubscription = this.dialogRef.backdropClick().subscribe(async () => this.closeWithUnsavedChangesCheck());
  }

  public ngOnDestroy(): void {
    this.backdropClickSubscription.unsubscribe();
  }

  public async closeWithUnsavedChangesCheck(): Promise<void> {
    if (await this.leaveDialogOpen()) {
      return;
    }

    this.dialogRef.close();
  }

  public async save(): Promise<void> {
    this.hasChanges = false;
    this.dialogRef.close({
      countOfVotersInformationSubTotals: this.countOfVotersInformationSubTotals,
      votingCards: this.votingCards,
      countingMachine: this.countingMachine,
    });
  }

  public contentChanged(): void {
    this.hasChanges =
      !isEqual(this.votingCards, this.originalVotingCards) ||
      !isEqual(this.countOfVotersInformationSubTotals, this.originalCountOfVotersInformationSubTotals) ||
      !isEqual(this.countingMachine, this.originalCountingMachine);
  }

  private async leaveDialogOpen(): Promise<boolean> {
    return this.hasChanges && !(await this.dialogService.confirm('APP.CHANGES.TITLE', this.i18n.instant('APP.CHANGES.MSG'), 'APP.YES'));
  }
}

export interface ContestDetailInfoDialogData {
  readonly: boolean;
  domainOfInfluenceTypes: DomainOfInfluenceType[];
  countingMachineEnabled: boolean;
  eVoting: boolean;
  enabledVoterTypes: VoterType[];
  countOfVotersInformationSubTotals: CountOfVotersInformationSubTotal[];
  votingCards: VotingCardResultDetail[];
  enabledVotingCardChannels: VotingCardChannel[];
  countingMachine: CountingMachine;
  canton: DomainOfInfluenceCanton;
  contestId?: string;
  countingCircleId?: string;
  electorateSummary?: ContestCountingCircleElectorateSummary;
}

export interface ContestDetailInfoDialogResult {
  countOfVotersInformationSubTotals: CountOfVotersInformationSubTotal[];
  votingCards: VotingCardResultDetail[];
  countingMachine: CountingMachine;
}
