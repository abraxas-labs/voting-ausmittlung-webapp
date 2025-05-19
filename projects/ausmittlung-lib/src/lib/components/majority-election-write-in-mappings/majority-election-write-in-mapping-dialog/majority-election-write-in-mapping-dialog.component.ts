/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MajorityElectionWriteInMapping, MajorityElectionWriteInMappings } from '../../../models';
import { ResultImportService } from '../../../services/result-import.service';
import { MajorityElectionWriteInMappingTarget } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_write_in_pb';
import { ResultImportType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/import_pb';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@abraxas/voting-lib';

@Component({
  selector: 'vo-ausm-majority-election-write-in-mapping-dialog',
  templateUrl: './majority-election-write-in-mapping-dialog.component.html',
  styleUrls: ['./majority-election-write-in-mapping-dialog.component.scss'],
  standalone: false,
})
export class MajorityElectionWriteInMappingDialogComponent implements OnInit {
  public saving: boolean = false;
  public loading: boolean = true;

  public selectedWriteInGroup?: MajorityElectionWriteInMappings;
  public readonly electionId?: string;
  public selectedGroupIndex: number = 0;

  public writeInGroups: MajorityElectionWriteInMappings[] = [];

  public useGroupTitleWithImportType: boolean = false;
  public useGroupTitleWithElection: boolean = false;

  private readonly contestId: string;
  private readonly countingCircleId: string;
  public importType?: ResultImportType;

  constructor(
    private readonly dialogRef: MatDialogRef<void>,
    private readonly resultImportService: ResultImportService,
    private readonly i18n: TranslateService,
    private readonly toast: SnackbarService,
    @Inject(MAT_DIALOG_DATA) dialogData: ResultImportWriteInMappingDialogData,
  ) {
    this.contestId = dialogData.contestId;
    this.countingCircleId = dialogData.countingCircleId;
    this.electionId = dialogData.electionId;
    this.importType = dialogData.importType;

    // enforce user to click on cancel to differ between reset write ins and normally close dialog
    this.dialogRef.disableClose = true;
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.loading = true;

      this.writeInGroups = await this.resultImportService.getMajorityElectionWriteInMappings(
        this.contestId,
        this.countingCircleId,
        this.electionId,
        this.importType,
      );

      this.useGroupTitleWithElection = this.electionId === undefined;
      this.useGroupTitleWithImportType = this.importType === undefined;
      if (this.writeInGroups.length === 0) {
        return;
      }

      this.useGroupTitleWithElection &&= this.writeInGroups.some(w => w.election.id !== this.writeInGroups[0].election.id);
      if (this.importType === undefined && this.writeInGroups.every(w => w.importType === this.writeInGroups[0].importType)) {
        this.useGroupTitleWithImportType = false;
        this.importType = this.writeInGroups[0].importType;
      }

      this.selectGroup(0);
    } finally {
      this.loading = false;
    }
  }

  public setMappings(mappings: MajorityElectionWriteInMapping[]): void {
    if (this.selectedWriteInGroup === undefined) {
      return;
    }

    this.selectedWriteInGroup.writeInMappings = mappings;
  }

  public async selectedGroupChange(index: number): Promise<void> {
    await this.save();
    this.selectGroup(index);
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async save(): Promise<void> {
    if (this.selectedWriteInGroup === undefined) {
      return;
    }

    try {
      this.saving = true;
      await this.resultImportService.mapMajorityElectionWriteIns(this.selectedWriteInGroup, this.countingCircleId);
    } finally {
      this.saving = false;
    }
  }

  public async resetWriteIns(): Promise<void> {
    if (this.selectedWriteInGroup == undefined) {
      return;
    }

    try {
      this.saving = true;
      await this.resultImportService.resetMajorityElectionWriteIns(
        this.selectedWriteInGroup.importId,
        this.selectedWriteInGroup.election.id,
        this.countingCircleId,
        this.selectedWriteInGroup.election.businessType,
      );
      this.toast.success(this.i18n.instant('RESULT_IMPORT.WRITE_INS.RESETTED'));
    } finally {
      this.saving = false;
    }
  }

  public hasUnmappedWriteIns(): boolean {
    return (
      this.selectedWriteInGroup?.writeInMappings.some(
        m => m.target === MajorityElectionWriteInMappingTarget.MAJORITY_ELECTION_WRITE_IN_MAPPING_TARGET_UNSPECIFIED,
      ) == true
    );
  }

  private selectGroup(index: number): void {
    if (index === this.writeInGroups.length) {
      this.dialogRef.close();
      return;
    }

    this.selectedGroupIndex = index;
    this.selectedWriteInGroup = this.writeInGroups[index];
  }
}

export interface ResultImportWriteInMappingDialogData {
  contestId: string;
  countingCircleId: string;
  electionId?: string;
  importType?: ResultImportType;
}
