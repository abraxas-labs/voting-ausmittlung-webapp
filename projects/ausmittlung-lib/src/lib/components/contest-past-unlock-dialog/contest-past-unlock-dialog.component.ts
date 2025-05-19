/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { Contest } from '../../models';
import { VOTING_BASIS_WEBAPP_URL } from '../../tokens';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-contest-past-unlock-dialog',
  templateUrl: './contest-past-unlock-dialog.component.html',
  standalone: false,
})
export class ContestPastUnlockDialogComponent {
  public readonly contest: Contest;

  constructor(
    @Inject(VOTING_BASIS_WEBAPP_URL) public readonly votingBasisWebAppUrl: string,
    @Inject(MAT_DIALOG_DATA) dialogData: ContestPastUnlockDialogData,
    private readonly dialogRef: MatDialogRef<any>,
  ) {
    this.contest = dialogData.contest;
  }

  public redirect(): void {
    window.open(this.votingBasisWebAppUrl, '_blank')?.focus();
    this.close();
  }

  public close(): void {
    this.dialogRef.close();
  }
}

export interface ContestPastUnlockDialogData {
  contest: Contest;
}
