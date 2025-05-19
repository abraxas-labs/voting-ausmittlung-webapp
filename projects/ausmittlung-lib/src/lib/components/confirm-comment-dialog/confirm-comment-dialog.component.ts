/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ConfirmDialogData, ConfirmDialogResult } from '@abraxas/voting-lib/lib/components/dialog/confirm-dialog/confirm-dialog.component';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-confirm-comment-dialog',
  templateUrl: './confirm-comment-dialog.component.html',
  styleUrls: ['./confirm-comment-dialog.component.scss'],
  standalone: false,
})
export class ConfirmCommentDialogComponent {
  public readonly title: string;
  public readonly message: string;
  public readonly confirmText: string;
  public readonly cancelText: string;
  public readonly showCancel: boolean;
  public readonly hasComment: boolean;
  public comment: string = '';

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmCommentDialogResult>,
    @Inject(MAT_DIALOG_DATA) dialogData: ConfirmCommentDialogData,
  ) {
    this.title = dialogData.title;
    this.message = dialogData.message;
    this.showCancel = dialogData.showCancel;

    this.confirmText = dialogData.confirmText ? dialogData.confirmText : 'COMMON.OK';
    this.cancelText = dialogData.cancelText ? dialogData.cancelText : 'COMMON.CANCEL';
    this.hasComment = dialogData.hasComment ?? false;
  }

  public confirm(): void {
    this.dialogRef.close({
      confirmed: true,
      comment: this.comment,
    });
  }

  public cancel(): void {
    this.dialogRef.close({
      confirmed: false,
      comment: this.comment,
    });
  }
}

export interface ConfirmCommentDialogData extends ConfirmDialogData {
  hasComment?: boolean;
}

export interface ConfirmCommentDialogResult extends ConfirmDialogResult {
  comment: string;
}
