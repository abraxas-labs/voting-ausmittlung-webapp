/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EchType, ImportFile } from './import-file.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResultImportService } from '../../services/result-import.service';
import { ResultImportType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/import_pb';

@Component({
  selector: 'vo-ausm-result-import-dialog',
  templateUrl: './result-import-dialog.component.html',
  standalone: false,
})
export class ResultImportDialogComponent {
  public importing: boolean = false;
  public files: ImportFile[] = [];
  public filesValid: boolean = false;

  private readonly importType: ResultImportType;
  private readonly contestId: string;
  private readonly countingCircleId?: string;
  public readonly requireECH110: boolean;
  public readonly canImport: boolean;

  constructor(
    private readonly resultImportService: ResultImportService,
    private readonly dialogRef: MatDialogRef<ResultImportDialogData>,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
    @Inject(MAT_DIALOG_DATA) dialogData: ResultImportDialogData,
  ) {
    this.importType = dialogData.importType;
    this.contestId = dialogData.contestId;
    this.countingCircleId = dialogData.countingCircleId;
    this.canImport = dialogData.canImport;

    // eCH 0220 v1.2 doesn't require eCH 0110 anymore
    // since we don't want a version selector,
    // we decide which version is imported based on the business case.
    this.requireECH110 = dialogData.importType == ResultImportType.RESULT_IMPORT_TYPE_EVOTING;
  }

  public filesChanged(files: ImportFile[]): void {
    this.files = files;

    if (this.requireECH110) {
      this.filesValid =
        files.length === 2 && files.some(f => f.echType === EchType.Ech0222) && files.some(f => f.echType === EchType.Ech0110);
    } else {
      this.filesValid = files.length === 1 && files[0].echType === EchType.Ech0222;
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async import(): Promise<void> {
    if (!this.filesValid) {
      return;
    }

    try {
      this.importing = true;
      const eCH0222File = this.files.find(f => f.echType === EchType.Ech0222)!;
      const eCH0110File = this.files.find(f => f.echType === EchType.Ech0110)!;
      await this.resultImportService.import(this.importType, this.contestId, this.countingCircleId, eCH0222File.file, eCH0110File?.file);
      this.toast.success(this.i18n.instant('RESULT_IMPORT.IMPORT_DONE'));
      this.dialogRef.close(true);
    } finally {
      this.importing = false;
    }
  }
}

export interface ResultImportDialogData {
  importType: ResultImportType;
  contestId: string;
  countingCircleId?: string;
  canImport: boolean;
}
