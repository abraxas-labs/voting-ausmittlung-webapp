/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ContestCountingCircleDetails,
  CountingMachine,
  CountOfVotersInformation,
  CountOfVotersInformationSubTotal,
  DomainOfInfluenceType,
  SexType,
  VoterType,
  VotingCardChannel,
  VotingCardResultDetail,
  VotingChannel,
} from '../../../models';
import { groupBy, sum } from '../../../services/utils/array.utils';
import {
  ContestDetailInfoDialogComponent,
  ContestDetailInfoDialogData,
  ContestDetailInfoDialogResult,
} from '../contest-detail-info-dialog/contest-detail-info-dialog.component';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { ContestCountingCircleDetailsService } from '../../../services/contest-counting-circle-details.service';
import { TranslateService } from '@ngx-translate/core';
import { ContestCountingCircleElectorateSummary } from '../../../models/contest-counting-circle-electorate.model';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';

@Component({
  selector: 'vo-ausm-contest-detail-info',
  templateUrl: './contest-detail-info.component.html',
  styleUrls: ['./contest-detail-info.component.scss'],
  standalone: false,
})
export class ContestDetailInfoComponent {
  public readonly votingChannels: typeof VotingChannel = VotingChannel;
  public readonly domainOfInfluenceCantons: typeof DomainOfInfluenceCanton = DomainOfInfluenceCanton;
  public readonly voterTypes: typeof VoterType = VoterType;

  public votingCardsByDoiType: { -readonly [key in keyof typeof DomainOfInfluenceType]?: VotingCardResultDetail[] } = {};
  public votingCardResultSummaries: SimpleVotingCardResultSummary[] = [];
  public subTotalInfoSummaries: SimpleSubTotalResultSummary[] = [];
  public votingCardsValue?: VotingCardResultDetail[];
  public enabledVotingCardChannelsValue: VotingCardChannel[] = [];
  public domainOfInfluenceTypesValue?: DomainOfInfluenceType[];
  public countOfVotersValue?: CountOfVotersInformation;
  public electorateSummaryValue?: ContestCountingCircleElectorateSummary;

  @Input()
  public readonly: boolean = true;

  @Input()
  public countingMachineEnabled: boolean = false;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  @Input()
  public eCountingResultsImported: boolean = false;

  @Input()
  public enabledVoterTypes: VoterType[] = [];

  @Input()
  public countingMachine: CountingMachine = CountingMachine.COUNTING_MACHINE_UNSPECIFIED;

  @Input()
  public contestId?: string;

  @Input()
  public countingCircleId?: string;

  @Input()
  public canton: DomainOfInfluenceCanton = DomainOfInfluenceCanton.DOMAIN_OF_INFLUENCE_CANTON_UNSPECIFIED;

  @Input()
  public set countOfVoters(v: CountOfVotersInformation) {
    this.countOfVotersValue = v;
    this.updateCountOfVoters();
  }

  @Input()
  public set votingCards(value: VotingCardResultDetail[]) {
    if (value === this.votingCardsValue) {
      return;
    }

    this.votingCardsValue = value;
    this.updateVotingCards();
  }

  @Input()
  public set electorateSummary(value: ContestCountingCircleElectorateSummary | undefined) {
    if (value === this.electorateSummaryValue) {
      return;
    }

    this.electorateSummaryValue = value;
    this.updateVotingCards();
  }

  @Input()
  public set enabledVotingCardChannels(v: VotingCardChannel[]) {
    if (v === this.enabledVotingCardChannelsValue) {
      return;
    }

    this.enabledVotingCardChannelsValue = v;
    this.updateVotingCards();
  }

  @Input()
  public set domainOfInfluenceTypes(v: DomainOfInfluenceType[]) {
    if (v === this.domainOfInfluenceTypesValue) {
      return;
    }

    this.domainOfInfluenceTypesValue = v;
    this.updateVotingCards();
  }

  @Output()
  public saved: EventEmitter<ContestCountingCircleDetails> = new EventEmitter<ContestCountingCircleDetails>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly contestCountingCircleDetailsService: ContestCountingCircleDetailsService,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
  ) {}

  public updateCountOfVoters(): void {
    if (!this.countOfVotersValue) return;

    const swissInfos = this.countOfVotersValue.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS);
    const swissAbroadInfos = this.countOfVotersValue.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS_ABROAD);
    const foreignerInfos = this.countOfVotersValue.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_FOREIGNER);
    const minorInfos = this.countOfVotersValue.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_MINOR);

    this.subTotalInfoSummaries = [];
    this.subTotalInfoSummaries.push({
      label: 'CONTEST.DETAIL.SWISS',
      voterType: VoterType.VOTER_TYPE_SWISS,
      men: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_MALE).countOfVoters ?? 0,
      women: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_FEMALE).countOfVoters ?? 0,
      total: sum(Object.values(swissInfos), x => x.countOfVoters),
    });

    if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_SWISS_ABROAD)) {
      this.subTotalInfoSummaries.push({
        label: 'CONTEST.DETAIL.SWISS_ABROAD',
        voterType: VoterType.VOTER_TYPE_SWISS_ABROAD,
        men: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_MALE).countOfVoters ?? 0,
        women: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_FEMALE).countOfVoters ?? 0,
        total: sum(Object.values(swissAbroadInfos), x => x.countOfVoters),
      });
    }

    if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_FOREIGNER)) {
      this.subTotalInfoSummaries.push({
        label: 'CONTEST.DETAIL.FOREIGNER',
        voterType: VoterType.VOTER_TYPE_FOREIGNER,
        men: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_MALE).countOfVoters ?? 0,
        women: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_FEMALE).countOfVoters ?? 0,
        total: sum(Object.values(foreignerInfos), x => x.countOfVoters),
      });
    }

    if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_MINOR)) {
      this.subTotalInfoSummaries.push({
        label: 'CONTEST.DETAIL.MINOR',
        voterType: VoterType.VOTER_TYPE_MINOR,
        men: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_MALE).countOfVoters ?? 0,
        women: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_FEMALE).countOfVoters ?? 0,
        total: sum(Object.values(minorInfos), x => x.countOfVoters),
      });
    }

    this.countOfVotersValue.totalCountOfVoters = sum(this.subTotalInfoSummaries, x => x.total);
  }

  public updateVotingCards(): void {
    if (!this.votingCardsValue || !this.domainOfInfluenceTypesValue || !this.enabledVotingCardChannelsValue) return;

    const vcByDoiType = groupBy(
      this.votingCardsValue,
      x => x.domainOfInfluenceType,
      x => x,
    );

    this.votingCardsByDoiType = {};
    for (const doiType of this.domainOfInfluenceTypesValue) {
      const votingCardsForDoiType = vcByDoiType[doiType] ?? [];
      const byChannel = groupBy(
        votingCardsForDoiType,
        x => x.channel,
        x => x,
      );
      this.votingCardsByDoiType[doiType] =
        this.enabledVotingCardChannelsValue.length === 0
          ? votingCardsForDoiType
          : this.enabledVotingCardChannelsValue.map(c => ({
              countOfReceivedVotingCards: byChannel[c.votingChannel]?.find(x => x.valid === c.valid)?.countOfReceivedVotingCards,
              domainOfInfluenceType: doiType,
              valid: c.valid,
              channel: c.votingChannel,
            }));
    }

    this.updateVotingCardResultSummaries();
  }

  public async openDialog(): Promise<void> {
    if (!this.countOfVotersValue || !this.enabledVotingCardChannelsValue || !this.domainOfInfluenceTypesValue || !this.votingCardsValue)
      return;

    const data: ContestDetailInfoDialogData = {
      readonly: this.readonly,
      domainOfInfluenceTypes: this.domainOfInfluenceTypesValue,
      countingMachineEnabled: this.countingMachineEnabled,
      eVoting: this.eVoting,
      enabledVoterTypes: this.enabledVoterTypes,
      countOfVoters: this.countOfVotersValue,
      enabledVotingCardChannels: this.enabledVotingCardChannelsValue,
      votingCards: this.votingCardsValue,
      countingMachine: this.countingMachine,
      canton: this.canton,
      contestId: this.contestId,
      countingCircleId: this.countingCircleId,
      electorateSummary: this.electorateSummaryValue,
    };

    const result = await this.dialogService.openForResult<ContestDetailInfoDialogComponent, ContestDetailInfoDialogResult>(
      ContestDetailInfoDialogComponent,
      data,
    );

    if (!result || this.readonly || !this.contestId || !this.countingCircleId) {
      return;
    }

    this.countOfVotersValue = result.countOfVoters;
    this.countingMachine = result.countingMachine;
    this.votingCardsValue = result.votingCards;

    if (!this.countingMachineEnabled) {
      this.countingMachine = CountingMachine.COUNTING_MACHINE_UNSPECIFIED;
    }

    this.updateCountOfVoters();
    this.updateVotingCards();

    const details = {
      contestId: this.contestId,
      countingCircleId: this.countingCircleId,
      countingMachine: this.countingMachine,
      countOfVotersInformation: this.countOfVotersValue,
      votingCards: this.votingCardsValue,
      eVoting: this.eVoting,
      eCounting: this.eCounting,
      eCountingResultsImported: this.eCountingResultsImported,
    };

    await this.contestCountingCircleDetailsService.updateDetails(details);
    this.toast.success(this.i18n.instant('CONTEST.DETAIL.COUNTING_CIRCLE_DETAILS_SAVED'));
    this.saved.emit(details);
  }

  private getDetail(voterType: VoterType, sex: SexType): CountOfVotersInformationSubTotal {
    let result = this.countOfVotersValue!.subTotalInfoList.find(c => c.voterType === voterType && c.sex === sex);
    if (result) {
      return result;
    }

    // don't set the numeric value => textfield should be empty as long as no input is provided
    result = {
      sex,
      voterType,
    } as CountOfVotersInformationSubTotal;

    this.countOfVotersValue?.subTotalInfoList.push(result);
    return result;
  }

  private updateVotingCardResultSummaries(): void {
    this.votingCardResultSummaries = [];

    if (!this.electorateSummaryValue) {
      for (const doiType of this.domainOfInfluenceTypesValue!) {
        if (this.votingCardsByDoiType[doiType] === undefined) {
          continue;
        }

        const votingCards = this.votingCardsByDoiType[doiType] ?? [];
        this.votingCardResultSummaries.push({
          label: this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', { type: this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${doiType}`) }),
          votingCards: votingCards,
          totalVotingCards: sum(votingCards, x => x.countOfReceivedVotingCards ?? 0),
          totalValidVotingCards: sum(
            votingCards.filter(x => x.valid),
            x => x.countOfReceivedVotingCards ?? 0,
          ),
          hasInvalidVotingCardChannel: votingCards.some(x => !x.valid),
        });
      }

      return;
    }

    for (const electorate of this.electorateSummaryValue.effectiveElectoratesList) {
      const doiTypes = electorate.domainOfInfluenceTypesList;

      const votingCards = this.votingCardsByDoiType[doiTypes[0]] ?? [];
      this.votingCardResultSummaries.push({
        label: this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', {
          type: doiTypes.map(d => this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${d}`)).join(', '),
        }),
        votingCards: votingCards,
        totalVotingCards: sum(votingCards, x => x.countOfReceivedVotingCards ?? 0),
        totalValidVotingCards: sum(
          votingCards.filter(x => x.valid),
          x => x.countOfReceivedVotingCards ?? 0,
        ),
        hasInvalidVotingCardChannel: votingCards.some(x => !x.valid),
      });
    }
  }
}

interface SimpleVotingCardResultSummary {
  label: string;
  votingCards: VotingCardResultDetail[];
  totalVotingCards: number;
  totalValidVotingCards: number;
  hasInvalidVotingCardChannel: boolean;
}

interface SimpleSubTotalResultSummary {
  label: string;
  voterType: VoterType;
  men: number;
  women: number;
  total: number;
}
