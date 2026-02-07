/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DataRowComponent, NumberComponent, SelectionChange, SelectionDirective, TableDataSource } from '@abraxas/base-components';
import { SnackbarService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProportionalElectionList } from '../../../models';
import { ProportionalElectionResultBundleService } from '../../../services/proportional-election-result-bundle.service';
import { ProportionalElectionService } from '../../../services/proportional-election.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-proportional-election-new-bundle',
  templateUrl: './proportional-election-new-bundle.component.html',
  styleUrls: ['./proportional-election-new-bundle.component.scss'],
  standalone: false,
})
export class ProportionalElectionNewBundleComponent implements OnInit {
  private readonly dialogRef = inject<MatDialogRef<ProportionalElectionNewBundleComponentData>>(MatDialogRef);
  private readonly electionService = inject(ProportionalElectionService);
  private readonly resultBundleService = inject(ProportionalElectionResultBundleService);
  private readonly toast = inject(SnackbarService);
  private readonly i18n = inject(TranslateService);
  private readonly cd = inject(ChangeDetectorRef);

  public readonly columns = ['select', 'orderNumber', 'shortDescription', 'description'];
  public readonly dataSource = new TableDataSource<ProportionalElectionList>();
  public loading: boolean = true;
  public saving: boolean = false;

  public bundleNumber?: number;
  public listNumber?: string;
  public selectedList?: ProportionalElectionList;

  public readonly enableBundleNumber: boolean;

  private readonly electionId: string;
  private readonly electionResultId: string;

  @ViewChild('bundleNumberFormfield')
  private bundleNumberFormfield?: NumberComponent;

  @ViewChild('listNumberFormfield')
  private listNumberFormfield?: NumberComponent;

  @ViewChildren(DataRowComponent, { read: ElementRef })
  public selectedRowComponents!: QueryList<ElementRef>;

  @ViewChild('selection')
  private selection!: SelectionDirective<ProportionalElectionList>;

  constructor() {
    const dialogData = inject<ProportionalElectionNewBundleComponentData>(MAT_DIALOG_DATA);

    this.electionId = dialogData.electionId;
    this.electionResultId = dialogData.electionResultId;
    this.enableBundleNumber = dialogData.enableBundleNumber;
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
  }

  public async selectList(createBundle: boolean): Promise<void> {
    if (!this.listNumber) {
      return;
    }

    const filteredLists = this.dataSource.data.filter(x => x.orderNumber === this.listNumber);
    if (filteredLists.length !== 1) {
      return;
    }

    this.selection.toggleSelection(filteredLists[0]);

    // detect changes to make sure selected class is set
    this.cd.detectChanges();
    const selectedRowComponent = this.selectedRowComponents.find(x => x.nativeElement.classList.contains('bc-row-selected'));
    if (selectedRowComponent) {
      selectedRowComponent.nativeElement.scrollIntoView({ block: 'nearest' });
    }

    if (createBundle) {
      await this.createBundle(filteredLists[0]);
    }
  }

  public updateSelectedList(event: SelectionChange<ProportionalElectionList>): void {
    if (event.after.length === 1) {
      this.selectedList = event.after[0].value;
      return;
    }

    delete this.selectedList;
  }

  private async checkBundleNumber(): Promise<boolean> {
    return !!this.bundleNumber;
  }

  private setInitialFocus(): void {
    this.enableBundleNumber ? this.bundleNumberFormfield?.setFocus() : this.listNumberFormfield?.setFocus();
  }
}

export interface ProportionalElectionNewBundleComponentData {
  electionId: string;
  electionResultId: string;
  enableBundleNumber: boolean;
}

export interface ProportionalElectionNewBundleComponentResult {
  listId?: string;
  bundleId: string;
  bundleNumber: number;
}
