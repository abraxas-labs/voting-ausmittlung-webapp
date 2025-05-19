/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { Column, ColumnsComponent, FilterDirective, SortDirective, TableDataSource } from '@abraxas/base-components';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CountingCircleResultState,
  ResultOverviewCountingCircleResult,
  ResultOverviewCountingCircleWithDetails,
  VotingCardResultDetail,
  VotingChannel,
} from 'ausmittlung-lib';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-counting-circle-table',
  templateUrl: './counting-circle-table.component.html',
  styleUrls: ['./counting-circle-table.component.scss'],
  standalone: false,
})
export class CountingCircleTableComponent implements OnInit, AfterViewInit, OnChanges {
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
  public readonly counterProposal2TotalCountYesColumn = 'counterProposal2TotalCountYes';
  public readonly counterProposal2TotalCountNoColumn = 'counterProposal2TotalCountNo';
  public readonly counterProposal2TotalCountUnspecifiedColumn = 'counterProposal2TotalCountUnspecified';
  public readonly tieBreak1TotalCountYesColumn = 'tieBreak1TotalCountYes';
  public readonly tieBreak1TotalCountNoColumn = 'tieBreak1TotalCountNo';
  public readonly tieBreak1TotalCountUnspecifiedColumn = 'tieBreak1TotalCountUnspecified';
  public readonly tieBreak2TotalCountYesColumn = 'tieBreak2TotalCountYes';
  public readonly tieBreak2TotalCountNoColumn = 'tieBreak2TotalCountNo';
  public readonly tieBreak2TotalCountUnspecifiedColumn = 'tieBreak2TotalCountUnspecified';
  public readonly tieBreak3TotalCountYesColumn = 'tieBreak3TotalCountYes';
  public readonly tieBreak3TotalCountNoColumn = 'tieBreak3TotalCountNo';
  public readonly tieBreak3TotalCountUnspecifiedColumn = 'tieBreak3TotalCountUnspecified';

  public readonly allColumns: Column[] = [
    { id: this.stateColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.STATE') },
    { id: this.countingCircleColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTING_CIRCLE') },
    { id: this.receivedBallotsColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.RECEIVED_BALLOTS') },
    { id: this.blankBallotsColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.BLANK_BALLOTS') },
    { id: this.invalidBallotsColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.INVALID_BALLOTS') },
    { id: this.accountedBallotsColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.ACCOUNTED_BALLOTS') },
    { id: this.totalCountOfVotersColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TOTAL_COUNT_OF_VOTERS') },
    { id: this.votingCardsBallotBoxColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.VOTING_CARDS_BALLOT_BOX') },
    { id: this.votingCardsPaperColumn, label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.VOTING_CARDS_PAPER') },
    {
      id: this.votingCardsByMailValidColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.VOTING_CARDS_BY_MAIL_VALID'),
    },
    {
      id: this.votingCardsByMailInvalidColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.VOTING_CARDS_BY_MAIL_INVALID'),
    },
    {
      id: this.mainBallotTotalCountYesColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.MAIN_BALLOT_TOTAL_COUNT_YES'),
    },
    {
      id: this.mainBallotTotalCountNoColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.MAIN_BALLOT_TOTAL_COUNT_NO'),
    },
    {
      id: this.mainBallotTotalCountUnspecifiedColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.MAIN_BALLOT_TOTAL_COUNT_UNSPECIFIED'),
    },
    {
      id: this.counterProposal1TotalCountYesColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTER_PROPOSAL_1_TOTAL_COUNT_YES'),
    },
    {
      id: this.counterProposal1TotalCountNoColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTER_PROPOSAL_1_TOTAL_COUNT_NO'),
    },
    {
      id: this.counterProposal1TotalCountUnspecifiedColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTER_PROPOSAL_1_TOTAL_COUNT_UNSPECIFIED'),
    },
    {
      id: this.counterProposal2TotalCountYesColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTER_PROPOSAL_2_TOTAL_COUNT_YES'),
    },
    {
      id: this.counterProposal2TotalCountNoColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTER_PROPOSAL_2_TOTAL_COUNT_NO'),
    },
    {
      id: this.counterProposal2TotalCountUnspecifiedColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.COUNTER_PROPOSAL_2_TOTAL_COUNT_UNSPECIFIED'),
    },
    {
      id: this.tieBreak1TotalCountYesColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_1_TOTAL_COUNT_YES'),
    },
    {
      id: this.tieBreak1TotalCountNoColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_1_TOTAL_COUNT_NO'),
    },
    {
      id: this.tieBreak1TotalCountUnspecifiedColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_1_TOTAL_COUNT_UNSPECIFIED'),
    },
    {
      id: this.tieBreak2TotalCountYesColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_2_TOTAL_COUNT_YES'),
    },
    {
      id: this.tieBreak2TotalCountNoColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_2_TOTAL_COUNT_NO'),
    },
    {
      id: this.tieBreak2TotalCountUnspecifiedColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_2_TOTAL_COUNT_UNSPECIFIED'),
    },
    {
      id: this.tieBreak3TotalCountYesColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_3_TOTAL_COUNT_YES'),
    },
    {
      id: this.tieBreak3TotalCountNoColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_3_TOTAL_COUNT_NO'),
    },
    {
      id: this.tieBreak3TotalCountUnspecifiedColumn,
      label: this.i18n.instant('MONITORING_POLITICAL_BUSINESSES_OVERVIEW.TIE_BREAK_3_TOTAL_COUNT_UNSPECIFIED'),
    },
  ];

  public columnsToDisplay: string[] = this.allColumns.map(x => x.id);

  @Input()
  public set countingCircles(data: ResultOverviewCountingCircleResult[]) {
    this.dataSource.data = data;
  }

  @Input()
  public countingCirclesById: Record<string, ResultOverviewCountingCircleWithDetails> = {};

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  @ViewChild(ColumnsComponent)
  public columnsComponent!: ColumnsComponent;

  public dataSource = new TableDataSource<ResultOverviewCountingCircleResult>();
  public stateList: EnumItemDescription<CountingCircleResultState>[] = [];

  private initializingColumns: boolean = true;

  constructor(
    private readonly enumUtil: EnumUtil,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly i18n: TranslateService,
    private readonly storageService: StorageService,
  ) {}

  public ngOnInit(): void {
    this.stateList = this.enumUtil.getArrayWithDescriptions<CountingCircleResultState>(
      CountingCircleResultState,
      'COUNTING_CIRCLE_RESULT_STATE.',
    );

    this.setDataAccessors();

    const storedColumns = this.storageService.getMonitoringCockpitColumnIds();
    if (storedColumns) {
      this.columnsToDisplay = storedColumns;
    }
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
    this.initColumns();
  }

  public ngOnChanges() {
    const data = this.dataSource.data;
    if (!data) {
      return;
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

  public toggleAllFields(value: boolean): void {
    if (value) {
      this.columnsToDisplay = this.allColumns.map(column => column.id);
      return;
    }

    const storedColumns = this.storageService.getMonitoringCockpitColumnIds();
    if (!storedColumns) {
      return;
    }

    this.columnsToDisplay = storedColumns;
  }

  public onColumnsToggled(columns: string[]): void {
    if (this.initializingColumns) {
      return;
    }
    this.columnsToDisplay = [...columns];
    this.storageService.storeMonitoringCockpitColumnIds(this.columnsToDisplay);
  }

  public getVotingCardsValue(votingCards: VotingCardResultDetail[], channel: VotingChannel, valid: boolean): number | undefined {
    return votingCards.find(x => x.channel === channel && x.valid === valid)?.countOfReceivedVotingCards;
  }

  private initColumns(): void {
    for (const column of this.allColumns) {
      const active = this.columnsToDisplay.includes(column.id);
      this.columnsComponent.onColumnToggle(column.id, active);
    }

    this.initializingColumns = false;
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
        return this.countingCirclesById[data.countingCircleId].details.countOfVotersInformation.totalCountOfVoters;
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
}
