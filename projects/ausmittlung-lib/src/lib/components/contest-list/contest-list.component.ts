/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { ContestSummary } from '../../models';
import { FilterDirective, SortDirective, TableDataSource } from '@abraxas/base-components';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'vo-ausm-contest-list',
  templateUrl: './contest-list.component.html',
  standalone: false,
})
export class ContestListComponent implements OnInit, AfterViewInit, OnChanges {
  public readonly dateColumn = 'date';
  public readonly descriptionColumn = 'description';
  public readonly endOfTestingPhaseColumn = 'endOfTestingPhase';
  public readonly contestEntriesDetailsColumn = 'contestEntriesDetails';
  public readonly ownerColumn = 'owner';

  public readonly originalColumns = [
    this.dateColumn,
    this.descriptionColumn,
    this.endOfTestingPhaseColumn,
    this.contestEntriesDetailsColumn,
    this.ownerColumn,
  ];

  @Input()
  public set contests(contests: ContestSummary[]) {
    this.dataSource.data = contests;
  }

  @Input()
  public showEndOfTestingPhase: boolean = true;

  @Input()
  public showDescription: boolean = false;

  @Input()
  public showOwner: boolean = false;

  @Output()
  public openDetail: EventEmitter<ContestSummary> = new EventEmitter<ContestSummary>();

  @ViewChild(SortDirective)
  public sort!: SortDirective;

  @ViewChild(FilterDirective)
  public filter!: FilterDirective;

  public columns: string[] = [...this.originalColumns];
  public dataSource = new TableDataSource<ContestSummary>();

  constructor(private readonly i18n: TranslateService) {}

  public ngOnInit(): void {
    const dataAccessor = (data: ContestSummary, filterId: string): string | number | Date => {
      if (filterId === this.contestEntriesDetailsColumn) {
        return data.contestEntriesDetails
          .map(x =>
            this.i18n.instant('CONTEST.POLITICAL_BUSINESSES_ENTRY', {
              domainOfInfluenceType: this.i18n.instant('DOMAIN_OF_INFLUENCE_TYPES.' + x.domainOfInfluenceType),
              contestEntriesCount: x.contestEntriesCount,
            }),
          )
          .join(' ');
      }

      if (filterId === this.ownerColumn) {
        return data.domainOfInfluence?.authorityName ?? '';
      }

      return (data as Record<string, any>)[filterId] ?? '';
    };

    this.dataSource.filterDataAccessor = dataAccessor;
    this.dataSource.sortingDataAccessor = dataAccessor;
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  public ngOnChanges(): void {
    this.columns = [...this.originalColumns];
    if (!this.showOwner) {
      this.columns.splice(4, 1);
    }

    if (!this.showEndOfTestingPhase) {
      this.columns.splice(2, 1);
    }

    if (!this.showDescription) {
      this.columns.splice(1, 1);
    }
  }
}
