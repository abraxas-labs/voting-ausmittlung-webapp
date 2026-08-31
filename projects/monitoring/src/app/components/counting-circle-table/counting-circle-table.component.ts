/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, inject, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ColumnsComponent, FilterDirective, SortDirective, TableDataSource } from '@abraxas/base-components';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CountingCircleResultState,
  CountOfVotersInformationSubTotal,
  MajorityElectionCandidate,
  ProportionalElectionList,
  ResultOverviewCountingCircleResult,
  ResultOverviewCountingCircleWithDetails,
  SimplePoliticalBusiness,
  sum,
  VotingCardResultDetail,
  VotingChannel,
} from 'ausmittlung-lib';
import {
  PoliticalBusinessSubType,
  PoliticalBusinessType,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';

@Component({
  selector: 'app-counting-circle-table',
  templateUrl: './counting-circle-table.component.html',
  styleUrls: ['./counting-circle-table.component.scss'],
  standalone: false,
})
export class CountingCircleTableComponent implements OnInit, AfterViewInit, OnChanges {
  private readonly enumUtil = inject(EnumUtil);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public readonly countingCircleResultState: typeof CountingCircleResultState = CountingCircleResultState;
  public readonly votingChannel: typeof VotingChannel = VotingChannel;

  public readonly stateColumn = 'state';
  public readonly countingCircleColumn = 'countingCircle';
  public readonly receivedBallotsColumn = 'receivedBallots';
  public readonly blankBallotsColumn = 'blankBallots';
  public readonly invalidBallotsColumn = 'invalidBallots';
  public readonly accountedBallotsColumn = 'accountedBallots';
  public readonly totalCountOfVotersColumn = 'totalCountOfVoters';
  public readonly votingCardsBallotBoxColumn = 'votingCardsBallotBox';
  public readonly votingCardsPaperColumn = 'votingCardsPaper';
  public readonly votingCardsByMailValidColumn = 'votingCardsByMailValid';
  public readonly votingCardsByMailInvalidColumn = 'votingCardsByMailInvalid';
  public readonly mainBallotTotalCountYesColumn = 'mainBallotTotalCountYes';
  public readonly mainBallotTotalCountNoColumn = 'mainBallotTotalCountNo';
  public readonly mainBallotTotalCountUnspecifiedColumn = 'mainBallotTotalCountUnspecified';
  public readonly counterProposal1TotalCountYesColumn = 'counterProposal1TotalCountYes';
  public readonly counterProposal1TotalCountNoColumn = 'counterProposal1TotalCountNo';
  public readonly counterProposal1TotalCountUnspecifiedColumn = 'counterProposal1TotalCountUnspecified';
  public readonly variant1TotalCountYesColumn = 'variant1TotalCountYes';
  public readonly variant1TotalCountNoColumn = 'variant1TotalCountNo';
  public readonly variant1TotalCountUnspecifiedColumn = 'variant1TotalCountUnspecified';
  public readonly counterProposal2TotalCountYesColumn = 'counterProposal2TotalCountYes';
  public readonly counterProposal2TotalCountNoColumn = 'counterProposal2TotalCountNo';
  public readonly counterProposal2TotalCountUnspecifiedColumn = 'counterProposal2TotalCountUnspecified';
  public readonly variant2TotalCountYesColumn = 'variant2TotalCountYes';
  public readonly variant2TotalCountNoColumn = 'variant2TotalCountNo';
  public readonly variant2TotalCountUnspecifiedColumn = 'variant2TotalCountUnspecified';
  public readonly tieBreak1TotalCountYesColumn = 'tieBreak1TotalCountYes';
  public readonly tieBreak1TotalCountNoColumn = 'tieBreak1TotalCountNo';
  public readonly tieBreak1TotalCountUnspecifiedColumn = 'tieBreak1TotalCountUnspecified';
  public readonly tieBreak2TotalCountYesColumn = 'tieBreak2TotalCountYes';
  public readonly tieBreak2TotalCountNoColumn = 'tieBreak2TotalCountNo';
  public readonly tieBreak2TotalCountUnspecifiedColumn = 'tieBreak2TotalCountUnspecified';
  public readonly tieBreak3TotalCountYesColumn = 'tieBreak3TotalCountYes';
  public readonly tieBreak3TotalCountNoColumn = 'tieBreak3TotalCountNo';
  public readonly tieBreak3TotalCountUnspecifiedColumn = 'tieBreak3TotalCountUnspecified';
  public readonly individualVoteCountColumn = 'individualVoteCount';

  public columnsToDisplay: string[] = [];

  public defaultColumns: string[] = [
    this.stateColumn,
    this.countingCircleColumn,
    this.receivedBallotsColumn,
    this.blankBallotsColumn,
    this.invalidBallotsColumn,
    this.accountedBallotsColumn,
    this.totalCountOfVotersColumn,
    this.votingCardsBallotBoxColumn,
    this.votingCardsPaperColumn,
    this.votingCardsByMailValidColumn,
    this.votingCardsByMailInvalidColumn,
  ];

  public voteStandardColumns: string[] = [
    this.mainBallotTotalCountYesColumn,
    this.mainBallotTotalCountNoColumn,
    this.mainBallotTotalCountUnspecifiedColumn,
  ];
  public voteVariantColumns: string[] = [];
  public majorityElectionColumns: MajorityElectionCandidate[] = [];
  public individualVoteCountDisabled = false;
  public proportionalElectionColumns: ProportionalElectionList[] = [];

  @Input()
  public set countingCircles(data: ResultOverviewCountingCircleResult[]) {
    this.dataSource.data = data;

    this.majorityElectionColumns = this.getMajorityElectionColumns(data);
    this.individualVoteCountDisabled = !data.some(x => x.individualVoteCount !== undefined);
    this.proportionalElectionColumns = this.getProportionalElectionColumns(data);
    this.voteVariantColumns = this.getVoteVariantColumns(data);
  }

  @Input()
  public countingCirclesById: Record<string, ResultOverviewCountingCircleWithDetails> = {};

  @Input()
  public politicalBusiness?: SimplePoliticalBusiness;

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  @ViewChild(ColumnsComponent)
  public columnsComponent!: ColumnsComponent;

  public dataSource = new TableDataSource<ResultOverviewCountingCircleResult>();
  public stateList: EnumItemDescription<CountingCircleResultState>[] = [];

  public ngOnInit(): void {
    this.stateList = this.enumUtil.getArrayWithDescriptions<CountingCircleResultState>(
      CountingCircleResultState,
      'COUNTING_CIRCLE_RESULT_STATE.',
    );

    this.setDataAccessors();
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  public ngOnChanges() {
    const data = this.dataSource.data;
    if (!data) {
      return;
    }

    if (this.politicalBusiness?.businessType === PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_MAJORITY_ELECTION) {
      this.columnsToDisplay = [...this.defaultColumns, ...this.majorityElectionColumns.map(x => x.id)];
      if (!this.individualVoteCountDisabled) {
        this.columnsToDisplay.push(this.individualVoteCountColumn);
      }
    } else if (this.politicalBusiness?.businessType === PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_PROPORTIONAL_ELECTION) {
      this.columnsToDisplay = [...this.defaultColumns, ...this.proportionalElectionColumns.map(x => x.id)];
    } else if (this.politicalBusiness?.businessType === PoliticalBusinessType.POLITICAL_BUSINESS_TYPE_VOTE) {
      if (this.politicalBusiness.businessSubType === PoliticalBusinessSubType.POLITICAL_BUSINESS_SUB_TYPE_VOTE_VARIANT_BALLOT) {
        this.columnsToDisplay = [...this.defaultColumns, ...this.voteVariantColumns];
      } else {
        this.columnsToDisplay = [...this.defaultColumns, ...this.voteStandardColumns];
      }
    }
  }

  public async openDetail(countingCircleId: string, politicalBusinessId: string): Promise<void> {
    await this.router.navigate([countingCircleId], {
      relativeTo: this.route,
      queryParams: {
        politicalBusinessId: politicalBusinessId,
      },
    });
  }

  public getVotingCardsValue(votingCards: VotingCardResultDetail[], channel: VotingChannel, valid: boolean): number | undefined {
    return votingCards.find(x => x.channel === channel && x.valid === valid)?.countOfReceivedVotingCards;
  }

  public getTotalCountOfVoters(subTotals: CountOfVotersInformationSubTotal[]): number {
    if (subTotals.length === 0) {
      return 0;
    }

    const doiTypes = subTotals.map(st => st.domainOfInfluenceType);
    let highestHierarchicalDoiType = doiTypes[0];

    for (const doiType of doiTypes) {
      if (highestHierarchicalDoiType > doiType) {
        highestHierarchicalDoiType = doiType;
      }
    }

    return sum(
      subTotals.filter(st => st.domainOfInfluenceType === highestHierarchicalDoiType),
      st => st.countOfVoters ?? 0,
    );
  }

  private setDataAccessors(): void {
    const baseDataAccessor = (data: ResultOverviewCountingCircleResult, columnId: string): string | number | Date => {
      if (columnId === this.countingCircleColumn) {
        return this.countingCirclesById[data.countingCircleId].countingCircle.name;
      }

      if (columnId === this.receivedBallotsColumn) {
        return data.countOfVoters?.totalReceivedBallots ?? 0;
      }

      if (columnId === this.blankBallotsColumn) {
        return data.countOfVoters?.totalBlankBallots ?? 0;
      }

      if (columnId === this.invalidBallotsColumn) {
        return data.countOfVoters?.totalInvalidBallots ?? 0;
      }

      if (columnId === this.accountedBallotsColumn) {
        return data.countOfVoters?.totalAccountedBallots ?? 0;
      }

      if (columnId === this.totalCountOfVotersColumn) {
        return this.getTotalCountOfVoters(this.countingCirclesById[data.countingCircleId].details.countOfVotersInformationSubTotals);
      }

      if (columnId === this.votingCardsBallotBoxColumn) {
        return (
          this.getVotingCardsValue(
            this.countingCirclesById[data.countingCircleId].details.votingCards,
            VotingChannel.VOTING_CHANNEL_BALLOT_BOX,
            true,
          ) ?? 0
        );
      }

      if (columnId === this.votingCardsPaperColumn) {
        return (
          this.getVotingCardsValue(
            this.countingCirclesById[data.countingCircleId].details.votingCards,
            VotingChannel.VOTING_CHANNEL_PAPER,
            true,
          ) ?? 0
        );
      }

      if (columnId === this.votingCardsByMailValidColumn) {
        return (
          this.getVotingCardsValue(
            this.countingCirclesById[data.countingCircleId].details.votingCards,
            VotingChannel.VOTING_CHANNEL_BY_MAIL,
            true,
          ) ?? 0
        );
      }

      if (columnId === this.votingCardsByMailInvalidColumn) {
        return (
          this.getVotingCardsValue(
            this.countingCirclesById[data.countingCircleId].details.votingCards,
            VotingChannel.VOTING_CHANNEL_BY_MAIL,
            false,
          ) ?? 0
        );
      }

      if (this.majorityElectionColumns.some(x => x.id === columnId)) {
        return data.candidateResults?.find(x => x.candidate.id === columnId)?.voteCount ?? 0;
      }

      if (this.proportionalElectionColumns.some(x => x.id === columnId)) {
        return data.listResults?.find(x => x.list!.id === columnId)?.totalVoteCount ?? 0;
      }

      return (data as Record<string, any>)[columnId] ?? '';
    };

    const filterDataAccessor = (data: ResultOverviewCountingCircleResult, columnId: string): string | number | Date => {
      return baseDataAccessor(data, columnId);
    };

    const sortDataAccessor = (data: ResultOverviewCountingCircleResult, columnId: string): string | number | Date => {
      if (columnId === this.stateColumn) {
        if (data.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY) {
          return data.state + '' + data.auditedTentativelyTimestamp!.getTime();
        }

        if (data.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED) {
          return data.state + '' + data.plausibilisedTimestamp!.getTime();
        }

        if (data.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION) {
          return data.state + '' + data.readyForCorrectionTimestamp!.getTime();
        }

        if (
          data.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE ||
          data.state === CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE
        ) {
          return data.state + '' + data.submissionDoneTimestamp!.getTime();
        }

        return data.state;
      }

      return baseDataAccessor(data, columnId);
    };

    this.dataSource.filterDataAccessor = filterDataAccessor;
    this.dataSource.sortingDataAccessor = sortDataAccessor;
  }

  private getMajorityElectionColumns(data: ResultOverviewCountingCircleResult[]): MajorityElectionCandidate[] {
    const uniqueCandidates = new Map(
      data
        .flatMap(result => result.candidateResults ?? [])
        .map(candidateResult => [candidateResult.candidate.id, candidateResult.candidate]),
    );

    return Array.from(uniqueCandidates.values());
  }

  private getProportionalElectionColumns(data: ResultOverviewCountingCircleResult[]): ProportionalElectionList[] {
    const uniqueLists = new Map(
      data.flatMap(result => result.listResults ?? []).map(listResult => [listResult.list!.id, listResult.list!]),
    );

    return Array.from(uniqueLists.values());
  }

  private getVoteVariantColumns(data: ResultOverviewCountingCircleResult[]): string[] {
    if (data.length === 0) {
      return [];
    }

    const voteVariantConfig: { property: keyof ResultOverviewCountingCircleResult; column: string }[] = [
      { property: 'mainBallotTotalCountYes', column: this.mainBallotTotalCountYesColumn },
      { property: 'mainBallotTotalCountNo', column: this.mainBallotTotalCountNoColumn },
      { property: 'mainBallotTotalCountUnspecified', column: this.mainBallotTotalCountUnspecifiedColumn },
      { property: 'counterProposal1TotalCountYes', column: this.counterProposal1TotalCountYesColumn },
      { property: 'counterProposal1TotalCountNo', column: this.counterProposal1TotalCountNoColumn },
      { property: 'counterProposal1TotalCountUnspecified', column: this.counterProposal1TotalCountUnspecifiedColumn },
      { property: 'variant1TotalCountYes', column: this.variant1TotalCountYesColumn },
      { property: 'variant1TotalCountNo', column: this.variant1TotalCountNoColumn },
      { property: 'variant1TotalCountUnspecified', column: this.variant1TotalCountUnspecifiedColumn },
      { property: 'counterProposal2TotalCountYes', column: this.counterProposal2TotalCountYesColumn },
      { property: 'counterProposal2TotalCountNo', column: this.counterProposal2TotalCountNoColumn },
      { property: 'counterProposal2TotalCountUnspecified', column: this.counterProposal2TotalCountUnspecifiedColumn },
      { property: 'variant2TotalCountYes', column: this.variant2TotalCountYesColumn },
      { property: 'variant2TotalCountNo', column: this.variant2TotalCountNoColumn },
      { property: 'variant2TotalCountUnspecified', column: this.variant2TotalCountUnspecifiedColumn },
      { property: 'tieBreak1TotalCountYes', column: this.tieBreak1TotalCountYesColumn },
      { property: 'tieBreak1TotalCountNo', column: this.tieBreak1TotalCountNoColumn },
      { property: 'tieBreak1TotalCountUnspecified', column: this.tieBreak1TotalCountUnspecifiedColumn },
      { property: 'tieBreak2TotalCountYes', column: this.tieBreak2TotalCountYesColumn },
      { property: 'tieBreak2TotalCountNo', column: this.tieBreak2TotalCountNoColumn },
      { property: 'tieBreak2TotalCountUnspecified', column: this.tieBreak2TotalCountUnspecifiedColumn },
      { property: 'tieBreak3TotalCountYes', column: this.tieBreak3TotalCountYesColumn },
      { property: 'tieBreak3TotalCountNo', column: this.tieBreak3TotalCountNoColumn },
      { property: 'tieBreak3TotalCountUnspecified', column: this.tieBreak3TotalCountUnspecifiedColumn },
    ];

    const presentInAtLeastOne = new Set<keyof ResultOverviewCountingCircleResult>();

    for (const result of data) {
      for (const config of voteVariantConfig) {
        if (!presentInAtLeastOne.has(config.property) && result[config.property] !== undefined) {
          presentInAtLeastOne.add(config.property);
        }
      }

      if (presentInAtLeastOne.size === voteVariantConfig.length) {
        break;
      }
    }

    return voteVariantConfig.filter(config => presentInAtLeastOne.has(config.property)).map(config => config.column);
  }
}
