/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-political-business-new-bundle-number',
  templateUrl: './political-business-new-bundle-number.component.html',
  styleUrls: ['./political-business-new-bundle-number.component.scss'],
  standalone: false,
})
export class PoliticalBusinessNewBundleNumberComponent {
  private readonly dialogRef = inject<MatDialogRef<any>>(MatDialogRef);

  public bundleNumber?: number;

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
  }

  private async checkBundleNumber(): Promise<boolean> {
    return !!this.bundleNumber;
  }
}
