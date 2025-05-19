/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ResultImportDialogComponent, ResultImportDialogData } from '../result-import-dialog/result-import-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResultImport } from '../../models';
import { ResultImportService } from '../../services/result-import.service';
import { ResultImportType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/import_pb';

export type ResultImportListDialogResult = 'imported' | 'deleted' | undefined;

@Component({
  selector: 'vo-ausm-result-import-list-dialog',
  templateUrl: './result-import-list-dialog.component.html',
  styleUrls: ['./result-import-list-dialog.component.scss'],
  standalone: false,
})
export class ResultImportListDialogComponent implements OnInit {
  public readonly columns = ['fileName', 'importType', 'startedBy', 'started'];
  public loading: boolean = true;
  public resultImports: ResultImport[] = [];
  public resultsImported: boolean = false;

  private readonly importType: ResultImportType;
  private readonly contestId: string;
  private readonly countingCircleId?: string;
  private readonly canImport: boolean;
  public readonly canDeleteImport: boolean;

  constructor(
    private readonly resultImportService: ResultImportService,
    private readonly dialogService: DialogService,
    private readonly toast: SnackbarService,
    private readonly i18n: TranslateService,
    private readonly dialogRef: MatDialogRef<ResultImportListDialogData>,
    @Inject(MAT_DIALOG_DATA) dialogData: ResultImportListDialogData,
  ) {
    this.importType = dialogData.importType;
    this.contestId = dialogData.contestId;
    this.countingCircleId = dialogData.countingCircleId;
    this.canDeleteImport = dialogData.canDeleteImport;
    this.canImport = dialogData.canImport;

    if (this.importType == ResultImportType.RESULT_IMPORT_TYPE_EVOTING) {
      this.columns.push('importedCountingCircles', 'ignoredCountingCircles');
    }
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.loading = true;
      this.resultImports = await this.resultImportService.listImportedResultFiles(this.importType, this.contestId, this.countingCircleId);

      if (this.resultImports.length === 0) {
        await this.showImportDialog();
      } else {
        this.resultsImported = !this.resultImports[0].deleted;
      }
    } finally {
      this.loading = false;
    }
  }

  public close(result?: ResultImportListDialogResult): void {
    this.dialogRef.close(result);
  }

  public async showImportDialog(): Promise<void> {
    const imported = await this.dialogService.openForResult(ResultImportDialogComponent, {
      importType: this.importType,
      contestId: this.contestId,
      countingCircleId: this.countingCircleId,
      canImport: this.canImport,
    } satisfies ResultImportDialogData);
    this.close(imported ? 'imported' : undefined);
  }

  public async deleteResults(): Promise<void> {
    const ok = await this.dialogService.confirm('RESULT_IMPORT.DELETE_CONFIRM_TITLE', 'RESULT_IMPORT.DELETE_CONFIRM_MSG');
    if (!ok) {
      return;
    }

    try {
      this.loading = true;
      await this.resultImportService.deleteResultImportData(this.importType, this.contestId, this.countingCircleId);
      this.toast.success(this.i18n.instant('RESULT_IMPORT.DELETE_SUCCESS'));
    } finally {
      this.loading = false;
    }

    this.close('deleted');
  }
}

export interface ResultImportListDialogData {
  importType: ResultImportType;
  contestId: string;
  countingCircleId?: string;
  canImport: boolean;
  canDeleteImport: boolean;
}
