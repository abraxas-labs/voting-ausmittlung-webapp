/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-political-business-new-bundle-number',
  templateUrl: './political-business-new-bundle-number.component.html',
  styleUrls: ['./political-business-new-bundle-number.component.scss'],
  standalone: false,
})
export class PoliticalBusinessNewBundleNumberComponent {
  public bundleNumber?: number;
  public duplicatedBundleNumber: boolean = false;

  private readonly usedBundleNumbers: number[];
  private readonly deletedUnusedBundleNumbers: number[];

  constructor(
    private readonly dialogRef: MatDialogRef<any>,
    private readonly dialog: DialogService,
    @Inject(MAT_DIALOG_DATA) dialogData: PoliticalBusinessNewBundleNumberComponentData,
  ) {
    this.usedBundleNumbers = dialogData.usedBundleNumbers;
    this.deletedUnusedBundleNumbers = dialogData.deletedUnusedBundleNumbers;
  }

  public async done(): Promise<void> {
    if (!(await this.checkBundleNumber())) {
      return;
    }

    this.dialogRef.close(this.bundleNumber);
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

  private async checkBundleNumber(): Promise<boolean> {
    if (!this.bundleNumber || this.duplicatedBundleNumber) {
      return false;
    }

    if (!this.usedBundleNumbers.includes(this.bundleNumber)) {
      return true;
    }

    return await this.dialog.confirm('POLITICAL_BUSINESS.REUSE_BUNDLE_NUMBER.TITLE', 'POLITICAL_BUSINESS.REUSE_BUNDLE_NUMBER.MSG');
  }
}

export interface PoliticalBusinessNewBundleNumberComponentData {
  usedBundleNumbers: number[];
  deletedUnusedBundleNumbers: number[];
}
