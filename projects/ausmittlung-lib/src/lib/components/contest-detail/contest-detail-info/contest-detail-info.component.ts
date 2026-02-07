/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import {
  ContestCountingCircleDetails,
  CountingMachine,
  CountOfVotersInformationSubTotal,
  DomainOfInfluenceType,
  SexType,
  VoterType,
  VotingCardChannel,
  VotingCardResultDetail,
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
import { VotingChannel } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/voting_channel_pb';

const infosWrappedMinOffsetTop = 50;
const infosWrappedClassName = 'infos-wrapped';

@Component({
  selector: 'vo-ausm-contest-detail-info',
  templateUrl: './contest-detail-info.component.html',
  styleUrls: ['./contest-detail-info.component.scss'],
  standalone: false,
})
export class ContestDetailInfoComponent implements AfterViewInit {
  private readonly dialogService = inject(DialogService);
  private readonly contestCountingCircleDetailsService = inject(ContestCountingCircleDetailsService);
  private readonly toast = inject(SnackbarService);
  private readonly i18n = inject(TranslateService);

  public readonly votingChannels: typeof VotingChannel = VotingChannel;
  public readonly domainOfInfluenceCantons: typeof DomainOfInfluenceCanton = DomainOfInfluenceCanton;

  public votingCardsByDoiType: { -readonly [key in keyof typeof DomainOfInfluenceType]?: VotingCardResultDetail[] } = {};
  public subTotalsByDoiType: { -readonly [key in keyof typeof DomainOfInfluenceType]?: SimpleSubTotalResultSummary[] } = {};

  public votingCardResultSummaries: SimpleVotingCardResultSummary[] = [];
  public countOfVotersSummaries: SimpleCountOfVotersInformationSummary[] = [];
  public votingCardsValue?: VotingCardResultDetail[];
  public enabledVotingCardChannelsValue: VotingCardChannel[] = [];
  public domainOfInfluenceTypesValue?: DomainOfInfluenceType[];
  public countOfVotersInformationSubTotalsValue?: CountOfVotersInformationSubTotal[];
  public electorateSummaryValue?: ContestCountingCircleElectorateSummary;
  public infosWrapped = false;
  public showSubTotalLabel = false;

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

  @ViewChild('votingCards') votingCardsRef!: ElementRef;

  @HostListener('window:resize')
  public onResize() {
    this.updateInfosWrapped();
  }

  @Input()
  public set countOfVotersInformationSubTotals(v: CountOfVotersInformationSubTotal[]) {
    if (v === this.countOfVotersInformationSubTotalsValue) {
      return;
    }

    this.countOfVotersInformationSubTotalsValue = v;
    this.updateCountOfVotersInformationSubTotals();
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
    this.updateCountOfVotersInformationSubTotals();
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
    this.updateCountOfVotersInformationSubTotals();
  }

  @Output()
  public saved: EventEmitter<ContestCountingCircleDetails> = new EventEmitter<ContestCountingCircleDetails>();
  public ngAfterViewInit(): void {
    // this is needed to ensure that the entire DOM is rendered already.
    setTimeout(() => this.updateInfosWrapped());
  }

  public updateCountOfVotersInformationSubTotals(): void {
    if (!this.countOfVotersInformationSubTotalsValue || !this.domainOfInfluenceTypesValue) return;

    const subTotalsByDoiType = groupBy(
      this.countOfVotersInformationSubTotalsValue,
      x => x.domainOfInfluenceType,
      x => x,
    );

    this.subTotalsByDoiType = {};

    for (const domainOfInfluenceType of this.domainOfInfluenceTypesValue) {
      const subTotalsForDoiType = subTotalsByDoiType[domainOfInfluenceType] ?? [];
      const subTotalInfoSummaries = [];

      const swissInfos = subTotalsForDoiType.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS);
      const swissAbroadInfos = subTotalsForDoiType.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS_ABROAD);
      const foreignerInfos = subTotalsForDoiType.filter(x => x.voterType === VoterType.VOTER_TYPE_FOREIGNER);
      const minorInfos = subTotalsForDoiType.filter(x => x.voterType === VoterType.VOTER_TYPE_MINOR);

      subTotalInfoSummaries.push({
        label: 'CONTEST.DETAIL.SWISS',
        voterType: VoterType.VOTER_TYPE_SWISS,
        men: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_MALE, domainOfInfluenceType).countOfVoters ?? 0,
        women: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_FEMALE, domainOfInfluenceType).countOfVoters ?? 0,
        total: sum(Object.values(swissInfos), x => x.countOfVoters),
        domainOfInfluenceType,
      });

      if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_SWISS_ABROAD)) {
        subTotalInfoSummaries.push({
          label: 'CONTEST.DETAIL.SWISS_ABROAD',
          voterType: VoterType.VOTER_TYPE_SWISS_ABROAD,
          men: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_MALE, domainOfInfluenceType).countOfVoters ?? 0,
          women: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_FEMALE, domainOfInfluenceType).countOfVoters ?? 0,
          total: sum(Object.values(swissAbroadInfos), x => x.countOfVoters),
          domainOfInfluenceType,
        });
      }

      if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_FOREIGNER)) {
        subTotalInfoSummaries.push({
          label: 'CONTEST.DETAIL.FOREIGNER',
          voterType: VoterType.VOTER_TYPE_FOREIGNER,
          men: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_MALE, domainOfInfluenceType).countOfVoters ?? 0,
          women: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_FEMALE, domainOfInfluenceType).countOfVoters ?? 0,
          total: sum(Object.values(foreignerInfos), x => x.countOfVoters),
          domainOfInfluenceType,
        });
      }

      if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_MINOR)) {
        subTotalInfoSummaries.push({
          label: 'CONTEST.DETAIL.MINOR',
          voterType: VoterType.VOTER_TYPE_MINOR,
          men: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_MALE, domainOfInfluenceType).countOfVoters ?? 0,
          women: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_FEMALE, domainOfInfluenceType).countOfVoters ?? 0,
          total: sum(Object.values(minorInfos), x => x.countOfVoters),
          domainOfInfluenceType,
        });
      }

      this.subTotalsByDoiType[domainOfInfluenceType] = subTotalInfoSummaries;
    }

    this.updateCountOfVotersInformationSubTotalSummaries();
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
    if (
      !this.countOfVotersInformationSubTotalsValue ||
      !this.enabledVotingCardChannelsValue ||
      !this.domainOfInfluenceTypesValue ||
      !this.votingCardsValue
    )
      return;

    const data: ContestDetailInfoDialogData = {
      readonly: this.readonly,
      domainOfInfluenceTypes: this.domainOfInfluenceTypesValue,
      countingMachineEnabled: this.countingMachineEnabled,
      eVoting: this.eVoting,
      enabledVoterTypes: this.enabledVoterTypes,
      countOfVotersInformationSubTotals: this.countOfVotersInformationSubTotalsValue,
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

    this.countOfVotersInformationSubTotalsValue = result.countOfVotersInformationSubTotals;
    this.countingMachine = result.countingMachine;
    this.votingCardsValue = result.votingCards;

    if (!this.countingMachineEnabled) {
      this.countingMachine = CountingMachine.COUNTING_MACHINE_UNSPECIFIED;
    }

    this.updateCountOfVotersInformationSubTotals();
    this.updateVotingCards();

    const details = {
      contestId: this.contestId,
      countingCircleId: this.countingCircleId,
      countingMachine: this.countingMachine,
      countOfVotersInformationSubTotals: this.countOfVotersInformationSubTotalsValue,
      votingCards: this.votingCardsValue,
      eVoting: this.eVoting,
      eCounting: this.eCounting,
      eCountingResultsImported: this.eCountingResultsImported,
    };

    await this.contestCountingCircleDetailsService.updateDetails(details);
    this.toast.success(this.i18n.instant('CONTEST.DETAIL.COUNTING_CIRCLE_DETAILS_SAVED'));
    this.saved.emit(details);
  }

  private getDetail(voterType: VoterType, sex: SexType, domainOfInfluenceType: DomainOfInfluenceType): CountOfVotersInformationSubTotal {
    let result = this.countOfVotersInformationSubTotalsValue!.find(
      c => c.voterType === voterType && c.sex === sex && c.domainOfInfluenceType === domainOfInfluenceType,
    );
    if (result) {
      return result;
    }

    // don't set the numeric value => textfield should be empty as long as no input is provided
    result = {
      sex,
      voterType,
      domainOfInfluenceType,
    } as CountOfVotersInformationSubTotal;

    this.countOfVotersInformationSubTotalsValue!.push(result);
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
        const label = this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', { type: this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${doiType}`) });
        this.votingCardResultSummaries.push(this.buildVotingCardResultSummary(label, votingCards));
      }

      return;
    }

    for (const electorate of this.electorateSummaryValue.effectiveElectoratesList) {
      const doiTypes = electorate.domainOfInfluenceTypesList;

      const votingCards = this.votingCardsByDoiType[doiTypes[0]] ?? [];
      const label = this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', {
        type: doiTypes.map(d => this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${d}`)).join(', '),
      });
      this.votingCardResultSummaries.push(this.buildVotingCardResultSummary(label, votingCards));
    }
  }

  private buildVotingCardResultSummary(label: string, votingCards: VotingCardResultDetail[]): SimpleVotingCardResultSummary {
    return {
      label: label,
      conventionalVotingCards: votingCards.filter(x => x.channel !== VotingChannel.VOTING_CHANNEL_E_VOTING),
      eVotingVotingCard: votingCards.find(x => x.channel === VotingChannel.VOTING_CHANNEL_E_VOTING),
      totalVotingCards: sum(votingCards, x => x.countOfReceivedVotingCards ?? 0),
      totalValidVotingCards: sum(
        votingCards.filter(x => x.valid),
        x => x.countOfReceivedVotingCards ?? 0,
      ),
      totalValidConventionalVotingCards: sum(
        votingCards.filter(x => x.valid && x.channel !== VotingChannel.VOTING_CHANNEL_E_VOTING),
        x => x.countOfReceivedVotingCards ?? 0,
      ),
      hasInvalidVotingCardChannel: votingCards.some(x => !x.valid),
    };
  }

  private updateCountOfVotersInformationSubTotalSummaries(): void {
    this.countOfVotersSummaries = [];

    if (!this.electorateSummaryValue) {
      for (const doiType of this.domainOfInfluenceTypesValue!) {
        if (this.subTotalsByDoiType[doiType] === undefined) {
          continue;
        }

        const doiTypeLabel = this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${doiType}`);
        this.countOfVotersSummaries.push({
          label: this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', { type: doiTypeLabel }),
          subTotalSummaries: this.subTotalsByDoiType[doiType],
          total: sum(this.subTotalsByDoiType[doiType], x => x.total),
          totalLabel: this.i18n.instant('CONTEST.DETAIL.TOTAL_FOR_TYPE', { type: doiTypeLabel }),
        });
      }
    } else {
      for (const electorate of this.electorateSummaryValue.effectiveElectoratesList) {
        const doiTypes = electorate.domainOfInfluenceTypesList;
        const subTotals = this.subTotalsByDoiType[doiTypes[0]] ?? [];
        const doiTypeLabel = doiTypes.map(d => this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${d}`)).join(', ');
        const doiTypeTotalLabel = this.i18n.instant('CONTEST.DETAIL.COUNT_OF_VOTERS');
        this.countOfVotersSummaries.push({
          label: this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', { type: doiTypeLabel }),
          subTotalSummaries: subTotals,
          total: sum(subTotals, x => x.total),
          totalLabel: this.i18n.instant('CONTEST.DETAIL.TOTAL_FOR_TYPE', { type: doiTypeTotalLabel }),
        });
      }
    }

    this.showSubTotalLabel =
      this.countOfVotersSummaries.length > 0 && this.countOfVotersSummaries.some(st => st.subTotalSummaries.length > 1);
  }

  private updateInfosWrapped(): void {
    if (!this.votingCardsRef) {
      return;
    }

    const votingCardsNativeElement = this.votingCardsRef.nativeElement as HTMLElement;
    const votingCardsOffsetTopDiff = votingCardsNativeElement.offsetTop - votingCardsNativeElement.parentElement!.offsetTop;

    if (votingCardsOffsetTopDiff > infosWrappedMinOffsetTop) {
      if (this.infosWrapped) {
        return;
      }

      this.infosWrapped = true;
      this.getVotingCardResultSummaryElements().forEach(e => {
        e.classList.add(infosWrappedClassName);
      });
    } else {
      if (!this.infosWrapped) {
        return;
      }

      this.infosWrapped = false;
      this.getVotingCardResultSummaryElements().forEach(e => {
        e.classList.remove(infosWrappedClassName);
      });
    }
  }

  private getVotingCardResultSummaryElements(): NodeListOf<HTMLElement> {
    return (this.votingCardsRef.nativeElement as HTMLElement).querySelectorAll('.voting-card-result-summary');
  }
}

interface SimpleVotingCardResultSummary {
  label: string;
  conventionalVotingCards: VotingCardResultDetail[];
  eVotingVotingCard?: VotingCardResultDetail;
  totalVotingCards: number;
  totalValidVotingCards: number;
  totalValidConventionalVotingCards: number;
  hasInvalidVotingCardChannel: boolean;
}

interface SimpleCountOfVotersInformationSummary {
  label: string;
  subTotalSummaries: SimpleSubTotalResultSummary[];
  total: number;
  totalLabel: string;
}

interface SimpleSubTotalResultSummary {
  label: string;
  voterType: VoterType;
  men: number;
  women: number;
  total: number;
  domainOfInfluenceType: DomainOfInfluenceType;
}
