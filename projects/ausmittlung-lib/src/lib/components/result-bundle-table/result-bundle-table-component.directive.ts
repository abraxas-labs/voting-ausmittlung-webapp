/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { AfterViewInit, Directive, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { PoliticalBusinessResultBundle, User } from '../../models';
import { PermissionService } from '../../services/permission.service';
import { UserService } from '../../services/user.service';
import { Permissions } from '../../models/permissions.model';
import { FilterDirective, PaginatorComponent, SortDirective, TableDataSource } from '@abraxas/base-components';
import { SelectionModel } from '@angular/cdk/collections';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';

@Directive()
export abstract class ResultBundleTableComponent<T extends PoliticalBusinessResultBundle = PoliticalBusinessResultBundle>
  implements OnInit, AfterViewInit
{
  public readonly bundleStates: typeof BallotBundleState = BallotBundleState;
  public readonly dataSource = new TableDataSource<T>();

  public readonly bundleSizeColumn = 'bundleSize';
  public readonly createdByColumn = 'createdBy';
  public readonly reviewedByColumn = 'reviewedBy';
  public readonly numberColumn = 'number';
  public readonly selectColumn = 'select';
  public readonly countOfBallotsColumn = 'countOfBallots';
  public readonly stateColumn = 'state';
  public readonly reviewColumn = 'review';
  public readonly actionsColumn = 'actions';

  @Input()
  public set bundles(bundles: T[]) {
    this.dataSource.data = bundles;
    this.selection.clear();
  }

  @Input()
  public bundleSize?: number;

  @Input()
  public enablePagination: boolean = false;

  @Input()
  public rowSelectable: boolean = false;

  @Input()
  public enableActions: boolean = false;

  @Input()
  public enableFiltering: boolean = false;

  @Input()
  public enableSorting: boolean = false;

  @Input()
  public readOnly: boolean = false;

  @Input()
  public enableReviewMultiple: boolean = false;

  @Input()
  public enableReviewColumn: boolean = false;

  @Output()
  public openDetail: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  public reviewBundle: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  public deleteBundle: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  public succeedBundleReview: EventEmitter<T[]> = new EventEmitter<T[]>();

  @Output()
  public rejectBundleReview: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  public generateBundleReviewExport: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  public downloadBundleReviewExport: EventEmitter<T> = new EventEmitter<T>();

  @ViewChild(PaginatorComponent)
  public paginator?: PaginatorComponent;

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  public currentUser?: User;
  public canDeleteBundle: boolean = false;
  public canReviewBundle: boolean = false;
  public canUpdate: boolean = false;
  public canUpdateAll: boolean = false;
  public canRead: boolean = false;
  public canReadAll: boolean = false;

  public selection = new SelectionModel<T>(true, []);
  public isAllSelected: boolean = false;
  public canReviewMultiple: boolean = false;

  public stateList: EnumItemDescription<BallotBundleState>[] = [];

  protected constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
    private readonly enumUtil: EnumUtil,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.currentUser = await this.userService.getUser();
    this.canDeleteBundle = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBundle.Delete);
    this.canReviewBundle = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBundle.Review);
    this.canUpdate = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBallot.Update);
    this.canUpdateAll = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBundle.UpdateAll);
    this.canRead = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBallot.Read);
    this.canReadAll = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResultBallot.ReadAll);
    const allStates = this.enumUtil.getArrayWithDescriptions<BallotBundleState>(BallotBundleState, 'ELECTION.BUNDLE_STATES.');
    this.stateList = allStates.map(x => ({ ...x, value: this.getBundleOrderNumber(x.value) }));
  }

  public ngAfterViewInit(): void {
    if (this.enablePagination && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    this.dataSource.filterDataAccessor = (data: T, filterId: string) => this.dataAccessor(data, filterId);
    this.dataSource.sortingDataAccessor = (data: T, filterId: string) => this.dataAccessor(data, filterId);

    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  public selectBundle(bundle: T): void {
    const isCreator = this.currentUser?.secureConnectId === bundle.createdBy.secureConnectId;

    if (
      !isCreator &&
      bundle.state === BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW &&
      this.canReviewBundle &&
      this.isReviewProcedureElectronically()
    ) {
      this.reviewBundle.emit(bundle);
      return;
    }

    if (!this.canReadAll && !(this.canRead && isCreator)) {
      return;
    }

    this.openDetail.emit(bundle);
  }

  public toggleAllRows(value: boolean) {
    if (value === this.isAllSelected) {
      return;
    }

    value ? this.selection.select(...this.dataSource.data) : this.selection.clear();
    this.updateIsAllSelected();
    this.updateCanReviewMultiple();
  }

  public toggleRow(row: T, value: boolean): void {
    if (value === this.selection.isSelected(row)) {
      return;
    }

    this.selection.toggle(row);
    this.updateIsAllSelected();
    this.updateCanReviewMultiple();
  }

  public updateIsAllSelected(): void {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    this.isAllSelected = numSelected === numRows;
  }

  public updateCanReviewMultiple(): void {
    this.canReviewMultiple =
      this.selection.selected.length > 0 &&
      this.selection.selected.every(
        x =>
          x.state === BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW &&
          x.createdBy.secureConnectId !== this.currentUser?.secureConnectId,
      );
  }

  protected abstract isReviewProcedureElectronically(): boolean;

  protected dataAccessor(data: T, filterId: string): string | number | Date {
    if (filterId === this.bundleSizeColumn) {
      return this.bundleSize ?? 0;
    }

    if (filterId === this.createdByColumn) {
      return data.createdBy.fullName;
    }

    if (filterId === this.reviewedByColumn) {
      return data.reviewedBy?.fullName ?? '';
    }

    if (filterId === this.stateColumn) {
      return this.getBundleOrderNumber(data.state);
    }

    return (data as Record<string, any>)[filterId] ?? '';
  }

  private getBundleOrderNumber(state: BallotBundleState): number {
    switch (state) {
      case BallotBundleState.BALLOT_BUNDLE_STATE_READY_FOR_REVIEW:
        return 1;
      case BallotBundleState.BALLOT_BUNDLE_STATE_IN_CORRECTION:
        return 2;
      case BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS:
        return 3;
      case BallotBundleState.BALLOT_BUNDLE_STATE_REVIEWED:
        return 4;
      case BallotBundleState.BALLOT_BUNDLE_STATE_DELETED:
        return 5;
      default:
        throw new Error('invalid bundle state');
    }
  }
}
