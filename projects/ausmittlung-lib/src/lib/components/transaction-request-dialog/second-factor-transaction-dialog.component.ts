/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-second-factor-transaction-dialog',
  templateUrl: './second-factor-transaction-dialog.component.html',
  styleUrls: ['./second-factor-transaction-dialog.component.scss'],
  standalone: false,
})
export class SecondFactorTransactionDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<SecondFactorTransactionDialogData>>(MatDialogRef);

  public hasError: boolean = false;
  public code: string;
  public showQrCode: boolean = false;
  public qrCode: string;

  constructor() {
    const dialogData = inject<SecondFactorTransactionDialogData>(MAT_DIALOG_DATA);

    this.code = dialogData.code;
    this.qrCode = dialogData.qrCode;
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}

export interface SecondFactorTransactionDialogData {
  code: string;
  qrCode: string;
}
