/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SnackbarService } from '@abraxas/voting-lib';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ExportService, ResultExportConfiguration, SimplePoliticalBusiness } from 'ausmittlung-lib';

@Component({
  selector: 'app-export-cockpit-dialog',
  templateUrl: './export-cockpit-dialog.component.html',
  styleUrls: ['./export-cockpit-dialog.component.scss'],
  standalone: false,
})
export class ExportCockpitDialogComponent implements OnInit {
  public loading: boolean = true;
  public saving: boolean = false;
  public triggeringExport: boolean = false;
  public triggerModeAuto: boolean = false;
  public configs: ResultExportConfiguration[] = [];
  public selectedConfig?: ResultExportConfiguration;

  public hasEdits: boolean = false;
  public isValid: boolean = false;

  constructor(
    private readonly dialogRef: MatDialogRef<ExportCockpitDialogData>,
    private readonly exportService: ExportService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public readonly dialogData: ExportCockpitDialogData,
  ) {}

  public async ngOnInit(): Promise<void> {
    try {
      this.configs = await this.exportService.listResultExportConfigurations(this.dialogData.contestId);
      if (this.configs.length > 0) {
        this.selectedConfig = this.configs[0];
      }
    } finally {
      this.loading = false;
    }
  }

  public async saveAndTriggerManualExport(): Promise<void> {
    if (!this.selectedConfig) {
      return;
    }

    this.triggeringExport = true;
    try {
      await this.save();
      await this.exportService.triggerResultExportConfigurations(
        this.dialogData.contestId,
        this.selectedConfig.exportConfigurationId,
        this.selectedConfig.politicalBusinessIdsList,
        this.selectedConfig.politicalBusinessMetadata,
      );
      this.toast.success(this.i18n.instant('EXPORT_COCKPIT.TRIGGERED'));
    } finally {
      this.triggeringExport = false;
    }
  }

  public async save(): Promise<void> {
    if (!this.selectedConfig || !this.hasEdits) {
      return;
    }

    this.saving = true;
    try {
      await this.exportService.updateResultExportConfigurations(this.selectedConfig);
      this.hasEdits = false;
      this.toast.success(this.i18n.instant('APP.SAVED'));
    } finally {
      this.saving = false;
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public setTriggerMode(auto: boolean): void {
    if (this.triggerModeAuto === auto || !this.selectedConfig) {
      return;
    }

    this.triggerModeAuto = auto;
    this.hasEdits = true;

    if (!auto) {
      delete this.selectedConfig.intervalMinutes;
      return;
    }

    if (this.selectedConfig.intervalMinutes === undefined) {
      this.selectedConfig.intervalMinutes = 30;
    }
  }

  public setSelectedConfig(config?: ResultExportConfiguration): void {
    this.hasEdits = false;
    this.selectedConfig = config;
    this.triggerModeAuto = config?.intervalMinutes !== undefined;
  }
}

export interface ExportCockpitDialogData {
  contestId: string;
  politicalBusinesses: SimplePoliticalBusiness[];
}
