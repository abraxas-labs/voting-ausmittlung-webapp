/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { NumberComponent, TableDataSource } from '@abraxas/base-components';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProportionalElectionList } from '../../../models';
import { ProportionalElectionResultBundleService } from '../../../services/proportional-election-result-bundle.service';
import { ProportionalElectionService } from '../../../services/proportional-election.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-proportional-election-new-bundle',
  templateUrl: './proportional-election-new-bundle.component.html',
  styleUrls: ['./proportional-election-new-bundle.component.scss'],
  standalone: false,
})
export class ProportionalElectionNewBundleComponent implements OnInit {
  public readonly columns = ['select', 'orderNumber', 'shortDescription', 'description'];
  public readonly dataSource = new TableDataSource<ProportionalElectionList>();
  public readonly selection = new SelectionModel<ProportionalElectionList>(false, []);
  public loading: boolean = true;
  public saving: boolean = false;

  public bundleNumber?: number;
  public listNumber?: string;
  public duplicatedBundleNumber: boolean = false;

  public readonly enableBundleNumber: boolean;

  public readonly usedBundleNumbers: number[];
  public readonly deletedUnusedBundleNumbers: number[];

  private readonly electionId: string;
  private readonly electionResultId: string;

  @ViewChild('bundleNumberFormfield')
  private bundleNumberFormfield?: NumberComponent;

  @ViewChild('listNumberFormfield')
  private listNumberFormfield?: NumberComponent;

  constructor(
    private readonly dialogRef: MatDialogRef<ProportionalElectionNewBundleComponentData>,
    private readonly dialog: DialogService,
    private readonly electionService: ProportionalElectionService,
    private readonly resultBundleService: ProportionalElectionResultBundleService,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
    private readonly cd: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) dialogData: ProportionalElectionNewBundleComponentData,
  ) {
    this.electionId = dialogData.electionId;
    this.electionResultId = dialogData.electionResultId;
    this.enableBundleNumber = dialogData.enableBundleNumber;
    this.usedBundleNumbers = dialogData.usedBundleNumbers;
    this.deletedUnusedBundleNumbers = dialogData.deletedUnusedBundleNumbers;
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.dataSource.data = await this.electionService.getLists(this.electionId);
    } finally {
      this.loading = false;
      this.cd.detectChanges();
      this.setInitialFocus();
    }
  }

  public toggleRow(row: ProportionalElectionList, value: boolean): void {
    if (value === this.selection.isSelected(row)) {
      return;
    }

    this.selection.toggle(row);
  }

  public async createBundle(list?: ProportionalElectionList): Promise<void> {
    if (this.enableBundleNumber && !(await this.checkBundleNumber())) {
      return;
    }

    this.saving = true;
    try {
      const response = await this.resultBundleService.createBundle(this.electionResultId, list?.id, this.bundleNumber);
      this.toast.success(this.i18n.instant('APP.SAVED'));

      const result: ProportionalElectionNewBundleComponentResult = {
        listId: list?.id,
        ...response,
      };
      this.dialogRef.close(result);
    } finally {
      this.saving = false;
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public updateBundleNumber(newNumber: number): void {
    if (!newNumber || newNumber < 0) {
      delete this.bundleNumber;
      return;
    }

    this.bundleNumber = +newNumber;
    this.duplicatedBundleNumber =
      this.usedBundleNumbers.includes(this.bundleNumber) && !this.deletedUnusedBundleNumbers.includes(this.bundleNumber);
  }

  public async selectList(createBundle: boolean): Promise<void> {
    if (!this.listNumber) {
      return;
    }

    const filteredLists = this.dataSource.data.filter(x => x.orderNumber === this.listNumber);
    if (filteredLists.length !== 1) {
      return;
    }

    this.selection.select(filteredLists[0]);

    if (createBundle) {
      await this.createBundle(filteredLists[0]);
    }
  }

  private async checkBundleNumber(): Promise<boolean> {
    if (!this.bundleNumber || this.duplicatedBundleNumber) {
      return false;
    }

    if (!this.usedBundleNumbers.includes(this.bundleNumber)) {
      return true;
    }

    return await this.dialog.confirm('POLITICAL_BUSINESS.REUSE_BUNDLE_NUMBER.TITLE', 'POLITICAL_BUSINESS.REUSE_BUNDLE_NUMBER.MSG');
  }

  private setInitialFocus(): void {
    this.enableBundleNumber ? this.bundleNumberFormfield?.setFocus() : this.listNumberFormfield?.setFocus();
  }
}

export interface ProportionalElectionNewBundleComponentData {
  electionId: string;
  electionResultId: string;
  enableBundleNumber: boolean;
  usedBundleNumbers: number[];
  deletedUnusedBundleNumbers: number[];
}

export interface ProportionalElectionNewBundleComponentResult {
  listId?: string;
  bundleId: string;
  bundleNumber: number;
}
