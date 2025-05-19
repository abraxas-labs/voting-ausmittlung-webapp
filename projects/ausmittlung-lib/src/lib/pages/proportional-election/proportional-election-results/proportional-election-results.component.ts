/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  dataSourceToPropertyPrefix,
  ProportionalElectionListResult,
  ProportionalElectionResult,
  ResultList,
  VotingDataSource,
} from '../../../models';
import { BreadcrumbItem, BreadcrumbsService } from '../../../services/breadcrumbs.service';
import { ProportionalElectionResultService } from '../../../services/proportional-election-result.service';
import { ResultService } from '../../../services/result.service';
import { distinct } from '../../../services/utils/array.utils';
import { DomainOfInfluenceType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/domain_of_influence_pb';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';

@Component({
  selector: 'vo-ausm-proportional-election-results',
  templateUrl: './proportional-election-results.component.html',
  styleUrls: ['./proportional-election-results.component.scss'],
  standalone: false,
})
export class ProportionalElectionResultsComponent implements OnDestroy {
  public readonly listResultColumns = [
    'orderNumber',
    'shortDescription',
    'unmodifiedListVotesCount',
    'unmodifiedListBlankRowsCount',
    'modifiedListVotesCount',
    'modifiedListBlankRowsCount',
    'unmodifiedListsCount',
    'modifiedListsCount',
  ];
  public readonly candidateColumns = [
    'number',
    'lastName',
    'firstName',
    'unmodifiedListVotesCount',
    'modifiedListVotesCount',
    'countOfVotesOnOtherLists',
    'countOfVotesFromAccumulations',
    'voteCount',
  ];

  public dataPrefix?: string;

  public contestResultList?: ResultList;
  public electionResult?: ProportionalElectionResult;
  public listResults: ProportionalElectionListResult[] = [];
  public selectedListResult?: ProportionalElectionListResult;
  public loading: boolean = true;
  public domainOfInfluenceTypes: DomainOfInfluenceType[] = [];
  public canton: DomainOfInfluenceCanton = DomainOfInfluenceCanton.DOMAIN_OF_INFLUENCE_CANTON_UNSPECIFIED;

  public breadcrumbs: BreadcrumbItem[];

  private readonly routeParamsSubscription: Subscription;

  constructor(
    route: ActivatedRoute,
    private readonly breadcrumbsService: BreadcrumbsService,
    private readonly resultService: ResultService,
    private readonly proportionalElectionResultService: ProportionalElectionResultService,
  ) {
    this.breadcrumbs = breadcrumbsService.forProportionalElectionResults();
    this.routeParamsSubscription = route.params.subscribe(({ resultId }) => this.loadData(resultId));
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  public selectListResult(listResult: ProportionalElectionListResult): void {
    this.selectedListResult = listResult;
  }

  public setDataPrefix(dataSource: VotingDataSource): void {
    this.dataPrefix = dataSourceToPropertyPrefix(dataSource);
  }

  private async loadData(resultId: string): Promise<void> {
    this.loading = true;
    try {
      this.electionResult = await this.proportionalElectionResultService.getByResultId(resultId);
      this.contestResultList = await this.resultService.getList(
        this.electionResult.election.contestId,
        this.electionResult.countingCircleId,
      );
      this.listResults = await this.proportionalElectionResultService.getListResults(resultId);
      this.breadcrumbs = this.breadcrumbsService.forProportionalElectionResults(this.electionResult);
      this.domainOfInfluenceTypes = distinct(
        this.contestResultList.results.map(r => r.politicalBusiness.domainOfInfluence!.type),
        x => x,
      );
      this.canton = this.electionResult.politicalBusiness.domainOfInfluence!.canton;
    } finally {
      this.loading = false;
    }
  }
}
