/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { ValidationSummary } from '../../models';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-validation-overview-dialog',
  templateUrl: './validation-overview-dialog.component.html',
})
export class ValidationOverviewDialogComponent {
  public readonly validationSummaries: ValidationSummary[];
  public readonly saveLabel: string;
  public readonly saveIcon?: string;
  public readonly header: string;
  public readonly canEmitSave: boolean;
  public readonly hintLabel?: string;
  public readonly hasSaveButton: boolean;

  constructor(
    private readonly dialogRef: MatDialogRef<boolean>,
    @Inject(MAT_DIALOG_DATA) dialogData: ValidationOverviewDialogData,
  ) {
    this.validationSummaries = dialogData.validationSummaries;
    this.saveLabel = dialogData.saveLabel;
    this.saveIcon = dialogData.saveIcon;
    this.header = dialogData.header;
    this.canEmitSave = dialogData.canEmitSave;
    this.hintLabel = dialogData.hintLabel;
    this.hasSaveButton = dialogData.hasSaveButton;
  }

  public close(): void {
    this.dialogRef.close();
  }

  public save(): void {
    const result: ValidationOverviewDialogResult = {
      save: this.canEmitSave,
    };

    this.dialogRef.close(result);
  }
}

export interface ValidationOverviewDialogData {
  validationSummaries: ValidationSummary[];
  canEmitSave: boolean;
  saveLabel: string;
  saveIcon?: string;
  hintLabel?: string;
  header: string;
  hasSaveButton: boolean;
}

export interface ValidationOverviewDialogResult {
  save: boolean;
}
