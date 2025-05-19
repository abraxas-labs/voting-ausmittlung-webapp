/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-second-factor-transaction-dialog',
  templateUrl: './second-factor-transaction-dialog.component.html',
  styleUrls: ['./second-factor-transaction-dialog.component.scss'],
  standalone: false,
})
export class SecondFactorTransactionDialogComponent {
  public hasError: boolean = false;
  public code: string;
  public showQrCode: boolean = false;
  public qrCode: string;

  constructor(
    private readonly dialogRef: MatDialogRef<SecondFactorTransactionDialogData>,
    @Inject(MAT_DIALOG_DATA) dialogData: SecondFactorTransactionDialogData,
  ) {
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
