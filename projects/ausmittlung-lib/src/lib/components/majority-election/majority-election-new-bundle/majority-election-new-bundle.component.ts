/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DataRowComponent, SelectionChange, SelectionDirective, TableDataSource } from '@abraxas/base-components';
import { ChangeDetectorRef, Component, ElementRef, inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MajorityElectionBallotGroup } from '../../../models';

@Component({
  selector: 'vo-ausm-majority-election-new-bundle',
  templateUrl: './majority-election-new-bundle.component.html',
  styleUrls: ['./majority-election-new-bundle.component.scss'],
  standalone: false,
})
export class MajorityElectionNewBundleComponent {
  public readonly data = inject<MajorityElectionNewBundleData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<MajorityElectionNewBundleComponent>>(MatDialogRef);
  private readonly cd = inject(ChangeDetectorRef);

  public bundleNumber?: number;
  private readonly ballotWithoutBallotGroupNumber = 99;
  public readonly columns = ['select', 'position', 'shortDescription', 'description'];
  public readonly dataSource = new TableDataSource<MajorityElectionBallotGroup>();
  public selectedBallotGroup?: MajorityElectionBallotGroup;
  public ballotGroupNumber?: number;

  @ViewChildren(DataRowComponent, { read: ElementRef })
  public selectedRowComponents!: QueryList<ElementRef>;

  @ViewChild('selection')
  private readonly selection!: SelectionDirective<MajorityElectionBallotGroup>;

  constructor() {
    this.dataSource.data = this.data.ballotGroups;
  }

  public get canSave(): boolean {
    return !this.data.enableBundleNumber || (!!this.bundleNumber && this.bundleNumber > 0);
  }

  public updateSelectedBallotGroup(event: SelectionChange<MajorityElectionBallotGroup>): void {
    this.selectedBallotGroup = event.after.length === 1 ? event.after[0].value : undefined;
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async save(ballotGroup?: MajorityElectionBallotGroup): Promise<void> {
    if (!this.canSave) {
      return;
    }
    this.dialogRef.close({ bundleNumber: this.bundleNumber, ballotGroupId: ballotGroup?.id });
  }

  public async selectBallotGroup(save: boolean): Promise<void> {
    if (!this.ballotGroupNumber) {
      return;
    }

    if (this.ballotGroupNumber === this.ballotWithoutBallotGroupNumber && save) {
      await this.save();
      return;
    }

    const filteredLists = this.dataSource.data.filter(x => x.position === this.ballotGroupNumber);
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

    if (save) {
      await this.save(filteredLists[0]);
    }
  }
}

export interface MajorityElectionNewBundleData {
  enableBundleNumber: boolean;
  ballotGroups: MajorityElectionBallotGroup[];
}

export interface MajorityElectionNewBundleResult {
  bundleNumber?: number;
  ballotGroupId?: string;
}
